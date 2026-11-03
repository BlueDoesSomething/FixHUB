const { queryRef, executeQuery, validateArgsWithOptions, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const ApplicationStatus = {
  PENDING: "PENDING",
  UNDER_REVIEW: "UNDER_REVIEW",
  NEEDS_INFORMATION: "NEEDS_INFORMATION",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
}
exports.ApplicationStatus = ApplicationStatus;

const RepairStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  EN_ROUTE: "EN_ROUTE",
  ARRIVED: "ARRIVED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
}
exports.RepairStatus = RepairStatus;

const ServiceType = {
  HOME: "HOME",
  DROPOFF: "DROPOFF",
  BOTH: "BOTH",
}
exports.ServiceType = ServiceType;

const UserRole = {
  CLIENT: "CLIENT",
  TECHNICIAN: "TECHNICIAN",
  ADMIN: "ADMIN",
}
exports.UserRole = UserRole;

const connectorConfig = {
  connector: 'main',
  service: 'fixhub',
  location: 'asia-southeast1'
};
exports.connectorConfig = connectorConfig;

const createMyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMyProfile', inputVars);
}
createMyProfileRef.operationName = 'CreateMyProfile';
exports.createMyProfileRef = createMyProfileRef;

exports.createMyProfile = function createMyProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createMyProfileRef(dcInstance, inputVars));
}
;

const updateMyProfileRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateMyProfile', inputVars);
}
updateMyProfileRef.operationName = 'UpdateMyProfile';
exports.updateMyProfileRef = updateMyProfileRef;

exports.updateMyProfile = function updateMyProfile(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(updateMyProfileRef(dcInstance, inputVars));
}
;

const submitMyApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'SubmitMyApplication', inputVars);
}
submitMyApplicationRef.operationName = 'SubmitMyApplication';
exports.submitMyApplicationRef = submitMyApplicationRef;

exports.submitMyApplication = function submitMyApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(submitMyApplicationRef(dcInstance, inputVars));
}
;

const adminStartApplicationReviewRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AdminStartApplicationReview', inputVars);
}
adminStartApplicationReviewRef.operationName = 'AdminStartApplicationReview';
exports.adminStartApplicationReviewRef = adminStartApplicationReviewRef;

exports.adminStartApplicationReview = function adminStartApplicationReview(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(adminStartApplicationReviewRef(dcInstance, inputVars));
}
;

const adminRequestApplicationInformationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AdminRequestApplicationInformation', inputVars);
}
adminRequestApplicationInformationRef.operationName = 'AdminRequestApplicationInformation';
exports.adminRequestApplicationInformationRef = adminRequestApplicationInformationRef;

exports.adminRequestApplicationInformation = function adminRequestApplicationInformation(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(adminRequestApplicationInformationRef(dcInstance, inputVars));
}
;

const adminRejectApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AdminRejectApplication', inputVars);
}
adminRejectApplicationRef.operationName = 'AdminRejectApplication';
exports.adminRejectApplicationRef = adminRejectApplicationRef;

exports.adminRejectApplication = function adminRejectApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(adminRejectApplicationRef(dcInstance, inputVars));
}
;

const adminApproveApplicationRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AdminApproveApplication', inputVars);
}
adminApproveApplicationRef.operationName = 'AdminApproveApplication';
exports.adminApproveApplicationRef = adminApproveApplicationRef;

exports.adminApproveApplication = function adminApproveApplication(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(adminApproveApplicationRef(dcInstance, inputVars));
}
;

const createMyRepairRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CreateMyRepairRequest', inputVars);
}
createMyRepairRequestRef.operationName = 'CreateMyRepairRequest';
exports.createMyRepairRequestRef = createMyRepairRequestRef;

exports.createMyRepairRequest = function createMyRepairRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(createMyRepairRequestRef(dcInstance, inputVars));
}
;

const cancelMyRepairRequestRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'CancelMyRepairRequest', inputVars);
}
cancelMyRepairRequestRef.operationName = 'CancelMyRepairRequest';
exports.cancelMyRepairRequestRef = cancelMyRepairRequestRef;

exports.cancelMyRepairRequest = function cancelMyRepairRequest(dcOrVars, vars) {
  const { dc: dcInstance, vars: inputVars } = validateArgs(connectorConfig, dcOrVars, vars, true);
  return executeMutation(cancelMyRepairRequestRef(dcInstance, inputVars));
}
;

const getMyProfileRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyProfile');
}
getMyProfileRef.operationName = 'GetMyProfile';
exports.getMyProfileRef = getMyProfileRef;

exports.getMyProfile = function getMyProfile(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMyProfileRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const getMyApplicationRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetMyApplication');
}
getMyApplicationRef.operationName = 'GetMyApplication';
exports.getMyApplicationRef = getMyApplicationRef;

exports.getMyApplication = function getMyApplication(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(getMyApplicationRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const adminListApplicationsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'AdminListApplications');
}
adminListApplicationsRef.operationName = 'AdminListApplications';
exports.adminListApplicationsRef = adminListApplicationsRef;

exports.adminListApplications = function adminListApplications(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(adminListApplicationsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;

const listMyRepairRequestsRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'ListMyRepairRequests');
}
listMyRepairRequestsRef.operationName = 'ListMyRepairRequests';
exports.listMyRepairRequestsRef = listMyRepairRequestsRef;

exports.listMyRepairRequests = function listMyRepairRequests(dcOrOptions, options) {
  
  const { dc: dcInstance, vars: inputVars, options: inputOpts } = validateArgsWithOptions(connectorConfig, dcOrOptions, options, undefined,false, false);
  return executeQuery(listMyRepairRequestsRef(dcInstance, inputVars), inputOpts && { fetchPolicy: inputOpts.fetchPolicy });
}
;
