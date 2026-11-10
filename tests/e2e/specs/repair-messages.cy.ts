describe('accepted repair conversations', () => {
  const repairId = '44444444-4444-4444-8444-444444444444';
  const customerId = '11111111-1111-4111-8111-111111111111';
  const technicianId = '22222222-2222-4222-8222-222222222222';
  const queue = {
    id: repairId, reference: 'FH-ACCEPTED', customer_name: 'Alex Customer',
    device: 'Phone', brand: 'Samsung', model: 'Galaxy', problem: 'A broken charging port',
    service_type: 'home', location: 'Makati City', latitude: 14.6, longitude: 121,
    created_at: new Date().toISOString(),
  };

  it('shows the requesting account, opens a thread on acceptance, and exchanges server-confirmed messages', () => {
    let accepted = false;
    let failNextMessage = true;
    let currentSender = technicianId;
    const rows: Record<string, unknown>[] = [];
    cy.intercept('POST', '**/rest/v1/rpc/list_available_repairs', req => { req.reply(accepted ? [] : [queue]); });
    cy.intercept('POST', '**/rest/v1/rpc/accept_repair_request', req => { accepted = true; req.reply({ statusCode: 204, body: '' }); });
    cy.intercept('POST', '**/rest/v1/rpc/list_my_repair_conversations', req => {
      req.reply(accepted ? [{ repair_id: repairId, reference: queue.reference,
        device: queue.device, model: queue.model, customer_id: customerId,
        technician_user_id: technicianId, customer_name: queue.customer_name,
        technician_name: 'Pat Technician', status: 'accepted', last_message_at: null }] : []);
    });
    cy.intercept('GET', '**/rest/v1/repair_messages*', req => { req.reply(rows); });
    cy.intercept('POST', '**/rest/v1/repair_messages*', req => {
      if (failNextMessage) {
        failNextMessage = false;
        req.reply({ statusCode: 503, body: { message: 'Offline' } });
        return;
      }
      const message = req.body as Record<string, string>;
      rows.push({ id: message.id, repair_id: message.repair_id, sender_id: currentSender,
        body: message.body, created_at: new Date().toISOString() });
      req.reply({ statusCode: 201, body: rows.at(-1) });
    });
    cy.intercept('GET', '**/rest/v1/repair_messages?id=*', { body: 'null', headers: { 'content-type': 'application/json' } });

    cy.signIn('technician');
    cy.get('.incoming-job').should('contain', 'Alex Customer');
    cy.visit('/technician/requests');
    cy.contains('.req-card', queue.reference).should('contain', 'Alex Customer').and('contain', 'Samsung Galaxy');
    cy.contains('.req-card', queue.reference).contains('button', 'Accept').click();
    cy.contains('The conversation is now in Messages.').should('be.visible');
    cy.contains('button', 'Open Messages').click();
    cy.get('[data-testid="repair-conversation"]').should('contain', 'Alex Customer').click();
    cy.get('#message-body').type('I can help with the charging port.');
    cy.contains('button', 'Send Message').click();
    cy.get('[role="alert"]').should('contain', 'not confirmed by FIXHUB');
    cy.get('#message-body').should('have.value', 'I can help with the charging port.');
    cy.get('[data-testid="repair-message"]').should('not.exist');
    cy.contains('button', 'Send Message').click();
    cy.get('[data-testid="repair-message"]').should('contain', 'I can help with the charging port.');
    cy.get('#message-body').should('have.value', '');

    currentSender = customerId;
    cy.signIn('client');
    cy.visit('/client/messages');
    cy.get('[data-testid="repair-conversation"]').should('contain', 'Pat Technician').click();
    cy.get('[data-testid="repair-message"]').should('contain', 'I can help with the charging port.');
    cy.get('#message-body').type('Thanks!');
    cy.contains('button', 'Send Message').click();
    cy.get('[data-testid="repair-message"]').should('have.length', 2).and('contain', 'Thanks!');
  });

  it('does not show a conversation or composer for a pending or unassigned repair', () => {
    cy.signIn('client');
    cy.visit(`/client/messages/chat/${repairId}`);
    cy.contains('This conversation is not available to your account.').should('be.visible');
    cy.get('#message-body').should('not.exist');
  });
});
