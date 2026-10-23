describe('Landing page', () => {
  it('visits the app root url and shows the brand', () => {
    cy.visit('/')
    cy.contains('FIXHUB')
  })
})
