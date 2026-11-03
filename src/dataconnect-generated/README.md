# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `main`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetMyProfile*](#getmyprofile)
  - [*GetMyApplication*](#getmyapplication)
  - [*AdminListApplications*](#adminlistapplications)
  - [*ListMyRepairRequests*](#listmyrepairrequests)
- [**Mutations**](#mutations)
  - [*CreateMyProfile*](#createmyprofile)
  - [*UpdateMyProfile*](#updatemyprofile)
  - [*SubmitMyApplication*](#submitmyapplication)
  - [*AdminStartApplicationReview*](#adminstartapplicationreview)
  - [*AdminRequestApplicationInformation*](#adminrequestapplicationinformation)
  - [*AdminRejectApplication*](#adminrejectapplication)
  - [*AdminApproveApplication*](#adminapproveapplication)
  - [*CreateMyRepairRequest*](#createmyrepairrequest)
  - [*CancelMyRepairRequest*](#cancelmyrepairrequest)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `main`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@fixhub/backend` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@fixhub/backend';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@fixhub/backend';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `main` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetMyProfile
You can execute the `GetMyProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyProfile(options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;

interface GetMyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyProfileData, undefined>;
}
export const getMyProfileRef: GetMyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyProfile(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyProfileData, undefined>;

interface GetMyProfileRef {
  ...
  (dc: DataConnect): QueryRef<GetMyProfileData, undefined>;
}
export const getMyProfileRef: GetMyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyProfileRef:
```typescript
const name = getMyProfileRef.operationName;
console.log(name);
```

### Variables
The `GetMyProfile` query has no variables.
### Return Type
Recall that executing the `GetMyProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyProfileData {
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    city: string;
    role: UserRole;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & User_Key;
}
```
### Using `GetMyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyProfile } from '@fixhub/backend';


// Call the `getMyProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyProfile();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyProfile(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getMyProfile().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetMyProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyProfileRef } from '@fixhub/backend';


// Call the `getMyProfileRef()` function to get a reference to the query.
const ref = getMyProfileRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyProfileRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

## GetMyApplication
You can execute the `GetMyApplication` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getMyApplication(options?: ExecuteQueryOptions): QueryPromise<GetMyApplicationData, undefined>;

interface GetMyApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetMyApplicationData, undefined>;
}
export const getMyApplicationRef: GetMyApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getMyApplication(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<GetMyApplicationData, undefined>;

interface GetMyApplicationRef {
  ...
  (dc: DataConnect): QueryRef<GetMyApplicationData, undefined>;
}
export const getMyApplicationRef: GetMyApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getMyApplicationRef:
```typescript
const name = getMyApplicationRef.operationName;
console.log(name);
```

### Variables
The `GetMyApplication` query has no variables.
### Return Type
Recall that executing the `GetMyApplication` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetMyApplicationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface GetMyApplicationData {
  technicianApplications: ({
    id: UUIDString;
    applicantId: string;
    fullName: string;
    email: string;
    contactNumber: string;
    city: string;
    yearsExperience: number;
    brands: string[];
    specializations: string[];
    experienceDescription: string;
    serviceType: ServiceType;
    coverageArea: string;
    workingDays: string[];
    workingHours: string;
    status: ApplicationStatus;
    feedback?: string | null;
    reviewedAt?: TimestampString | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
    applicationEvents_on_application: ({
      status: ApplicationStatus;
      note?: string | null;
      createdAt: TimestampString;
      actor: {
        fullName: string;
      };
    })[];
  } & TechnicianApplication_Key)[];
}
```
### Using `GetMyApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getMyApplication } from '@fixhub/backend';


// Call the `getMyApplication()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getMyApplication();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getMyApplication(dataConnect);

console.log(data.technicianApplications);

// Or, you can use the `Promise` API.
getMyApplication().then((response) => {
  const data = response.data;
  console.log(data.technicianApplications);
});
```

### Using `GetMyApplication`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getMyApplicationRef } from '@fixhub/backend';


// Call the `getMyApplicationRef()` function to get a reference to the query.
const ref = getMyApplicationRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getMyApplicationRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.technicianApplications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.technicianApplications);
});
```

## AdminListApplications
You can execute the `AdminListApplications` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
adminListApplications(options?: ExecuteQueryOptions): QueryPromise<AdminListApplicationsData, undefined>;

interface AdminListApplicationsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<AdminListApplicationsData, undefined>;
}
export const adminListApplicationsRef: AdminListApplicationsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
adminListApplications(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<AdminListApplicationsData, undefined>;

interface AdminListApplicationsRef {
  ...
  (dc: DataConnect): QueryRef<AdminListApplicationsData, undefined>;
}
export const adminListApplicationsRef: AdminListApplicationsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminListApplicationsRef:
```typescript
const name = adminListApplicationsRef.operationName;
console.log(name);
```

### Variables
The `AdminListApplications` query has no variables.
### Return Type
Recall that executing the `AdminListApplications` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminListApplicationsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AdminListApplicationsData {
  technicianApplications: ({
    id: UUIDString;
    applicantId: string;
    fullName: string;
    email: string;
    contactNumber: string;
    city: string;
    yearsExperience: number;
    brands: string[];
    specializations: string[];
    experienceDescription: string;
    serviceType: ServiceType;
    coverageArea: string;
    workingDays: string[];
    workingHours: string;
    status: ApplicationStatus;
    feedback?: string | null;
    reviewedAt?: TimestampString | null;
    createdAt: TimestampString;
    updatedAt: TimestampString;
    applicationEvents_on_application: ({
      status: ApplicationStatus;
      note?: string | null;
      createdAt: TimestampString;
      actor: {
        fullName: string;
      };
    })[];
  } & TechnicianApplication_Key)[];
}
```
### Using `AdminListApplications`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminListApplications } from '@fixhub/backend';


// Call the `adminListApplications()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminListApplications();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminListApplications(dataConnect);

console.log(data.technicianApplications);

// Or, you can use the `Promise` API.
adminListApplications().then((response) => {
  const data = response.data;
  console.log(data.technicianApplications);
});
```

### Using `AdminListApplications`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, adminListApplicationsRef } from '@fixhub/backend';


// Call the `adminListApplicationsRef()` function to get a reference to the query.
const ref = adminListApplicationsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminListApplicationsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.technicianApplications);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.technicianApplications);
});
```

## ListMyRepairRequests
You can execute the `ListMyRepairRequests` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
listMyRepairRequests(options?: ExecuteQueryOptions): QueryPromise<ListMyRepairRequestsData, undefined>;

interface ListMyRepairRequestsRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<ListMyRepairRequestsData, undefined>;
}
export const listMyRepairRequestsRef: ListMyRepairRequestsRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
listMyRepairRequests(dc: DataConnect, options?: ExecuteQueryOptions): QueryPromise<ListMyRepairRequestsData, undefined>;

interface ListMyRepairRequestsRef {
  ...
  (dc: DataConnect): QueryRef<ListMyRepairRequestsData, undefined>;
}
export const listMyRepairRequestsRef: ListMyRepairRequestsRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the listMyRepairRequestsRef:
```typescript
const name = listMyRepairRequestsRef.operationName;
console.log(name);
```

### Variables
The `ListMyRepairRequests` query has no variables.
### Return Type
Recall that executing the `ListMyRepairRequests` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `ListMyRepairRequestsData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface ListMyRepairRequestsData {
  repairRequests: ({
    id: UUIDString;
    device: string;
    brand: string;
    model: string;
    problem: string;
    serviceType: ServiceType;
    location: string;
    status: RepairStatus;
    createdAt: TimestampString;
    updatedAt: TimestampString;
  } & RepairRequest_Key)[];
}
```
### Using `ListMyRepairRequests`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, listMyRepairRequests } from '@fixhub/backend';


// Call the `listMyRepairRequests()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await listMyRepairRequests();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await listMyRepairRequests(dataConnect);

console.log(data.repairRequests);

// Or, you can use the `Promise` API.
listMyRepairRequests().then((response) => {
  const data = response.data;
  console.log(data.repairRequests);
});
```

### Using `ListMyRepairRequests`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, listMyRepairRequestsRef } from '@fixhub/backend';


// Call the `listMyRepairRequestsRef()` function to get a reference to the query.
const ref = listMyRepairRequestsRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = listMyRepairRequestsRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.repairRequests);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.repairRequests);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `main` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## CreateMyProfile
You can execute the `CreateMyProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createMyProfile(vars: CreateMyProfileVariables): MutationPromise<CreateMyProfileData, CreateMyProfileVariables>;

interface CreateMyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMyProfileVariables): MutationRef<CreateMyProfileData, CreateMyProfileVariables>;
}
export const createMyProfileRef: CreateMyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createMyProfile(dc: DataConnect, vars: CreateMyProfileVariables): MutationPromise<CreateMyProfileData, CreateMyProfileVariables>;

interface CreateMyProfileRef {
  ...
  (dc: DataConnect, vars: CreateMyProfileVariables): MutationRef<CreateMyProfileData, CreateMyProfileVariables>;
}
export const createMyProfileRef: CreateMyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createMyProfileRef:
```typescript
const name = createMyProfileRef.operationName;
console.log(name);
```

### Variables
The `CreateMyProfile` mutation requires an argument of type `CreateMyProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateMyProfileVariables {
  fullName: string;
  phone: string;
  city: string;
}
```
### Return Type
Recall that executing the `CreateMyProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateMyProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateMyProfileData {
  user_insert: User_Key;
}
```
### Using `CreateMyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createMyProfile, CreateMyProfileVariables } from '@fixhub/backend';

// The `CreateMyProfile` mutation requires an argument of type `CreateMyProfileVariables`:
const createMyProfileVars: CreateMyProfileVariables = {
  fullName: ..., 
  phone: ..., 
  city: ..., 
};

// Call the `createMyProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createMyProfile(createMyProfileVars);
// Variables can be defined inline as well.
const { data } = await createMyProfile({ fullName: ..., phone: ..., city: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createMyProfile(dataConnect, createMyProfileVars);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
createMyProfile(createMyProfileVars).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

### Using `CreateMyProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createMyProfileRef, CreateMyProfileVariables } from '@fixhub/backend';

// The `CreateMyProfile` mutation requires an argument of type `CreateMyProfileVariables`:
const createMyProfileVars: CreateMyProfileVariables = {
  fullName: ..., 
  phone: ..., 
  city: ..., 
};

// Call the `createMyProfileRef()` function to get a reference to the mutation.
const ref = createMyProfileRef(createMyProfileVars);
// Variables can be defined inline as well.
const ref = createMyProfileRef({ fullName: ..., phone: ..., city: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createMyProfileRef(dataConnect, createMyProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_insert);
});
```

## UpdateMyProfile
You can execute the `UpdateMyProfile` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateMyProfile(vars: UpdateMyProfileVariables): MutationPromise<UpdateMyProfileData, UpdateMyProfileVariables>;

interface UpdateMyProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: UpdateMyProfileVariables): MutationRef<UpdateMyProfileData, UpdateMyProfileVariables>;
}
export const updateMyProfileRef: UpdateMyProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateMyProfile(dc: DataConnect, vars: UpdateMyProfileVariables): MutationPromise<UpdateMyProfileData, UpdateMyProfileVariables>;

interface UpdateMyProfileRef {
  ...
  (dc: DataConnect, vars: UpdateMyProfileVariables): MutationRef<UpdateMyProfileData, UpdateMyProfileVariables>;
}
export const updateMyProfileRef: UpdateMyProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateMyProfileRef:
```typescript
const name = updateMyProfileRef.operationName;
console.log(name);
```

### Variables
The `UpdateMyProfile` mutation requires an argument of type `UpdateMyProfileVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateMyProfileVariables {
  fullName: string;
  phone: string;
  city: string;
}
```
### Return Type
Recall that executing the `UpdateMyProfile` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateMyProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateMyProfileData {
  user_update?: User_Key | null;
}
```
### Using `UpdateMyProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateMyProfile, UpdateMyProfileVariables } from '@fixhub/backend';

// The `UpdateMyProfile` mutation requires an argument of type `UpdateMyProfileVariables`:
const updateMyProfileVars: UpdateMyProfileVariables = {
  fullName: ..., 
  phone: ..., 
  city: ..., 
};

// Call the `updateMyProfile()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateMyProfile(updateMyProfileVars);
// Variables can be defined inline as well.
const { data } = await updateMyProfile({ fullName: ..., phone: ..., city: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateMyProfile(dataConnect, updateMyProfileVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateMyProfile(updateMyProfileVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateMyProfile`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateMyProfileRef, UpdateMyProfileVariables } from '@fixhub/backend';

// The `UpdateMyProfile` mutation requires an argument of type `UpdateMyProfileVariables`:
const updateMyProfileVars: UpdateMyProfileVariables = {
  fullName: ..., 
  phone: ..., 
  city: ..., 
};

// Call the `updateMyProfileRef()` function to get a reference to the mutation.
const ref = updateMyProfileRef(updateMyProfileVars);
// Variables can be defined inline as well.
const ref = updateMyProfileRef({ fullName: ..., phone: ..., city: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateMyProfileRef(dataConnect, updateMyProfileVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

## SubmitMyApplication
You can execute the `SubmitMyApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
submitMyApplication(vars: SubmitMyApplicationVariables): MutationPromise<SubmitMyApplicationData, SubmitMyApplicationVariables>;

interface SubmitMyApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SubmitMyApplicationVariables): MutationRef<SubmitMyApplicationData, SubmitMyApplicationVariables>;
}
export const submitMyApplicationRef: SubmitMyApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
submitMyApplication(dc: DataConnect, vars: SubmitMyApplicationVariables): MutationPromise<SubmitMyApplicationData, SubmitMyApplicationVariables>;

interface SubmitMyApplicationRef {
  ...
  (dc: DataConnect, vars: SubmitMyApplicationVariables): MutationRef<SubmitMyApplicationData, SubmitMyApplicationVariables>;
}
export const submitMyApplicationRef: SubmitMyApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the submitMyApplicationRef:
```typescript
const name = submitMyApplicationRef.operationName;
console.log(name);
```

### Variables
The `SubmitMyApplication` mutation requires an argument of type `SubmitMyApplicationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SubmitMyApplicationVariables {
  fullName: string;
  contactNumber: string;
  city: string;
  yearsExperience: number;
  brands: string[];
  specializations: string[];
  experienceDescription: string;
  serviceType: ServiceType;
  coverageArea: string;
  workingDays: string[];
  workingHours: string;
}
```
### Return Type
Recall that executing the `SubmitMyApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SubmitMyApplicationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface SubmitMyApplicationData {
  technicianApplication_insert: TechnicianApplication_Key;
  applicationEvent_insert: ApplicationEvent_Key;
}
```
### Using `SubmitMyApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, submitMyApplication, SubmitMyApplicationVariables } from '@fixhub/backend';

// The `SubmitMyApplication` mutation requires an argument of type `SubmitMyApplicationVariables`:
const submitMyApplicationVars: SubmitMyApplicationVariables = {
  fullName: ..., 
  contactNumber: ..., 
  city: ..., 
  yearsExperience: ..., 
  brands: ..., 
  specializations: ..., 
  experienceDescription: ..., 
  serviceType: ..., 
  coverageArea: ..., 
  workingDays: ..., 
  workingHours: ..., 
};

// Call the `submitMyApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await submitMyApplication(submitMyApplicationVars);
// Variables can be defined inline as well.
const { data } = await submitMyApplication({ fullName: ..., contactNumber: ..., city: ..., yearsExperience: ..., brands: ..., specializations: ..., experienceDescription: ..., serviceType: ..., coverageArea: ..., workingDays: ..., workingHours: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await submitMyApplication(dataConnect, submitMyApplicationVars);

console.log(data.technicianApplication_insert);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
submitMyApplication(submitMyApplicationVars).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_insert);
  console.log(data.applicationEvent_insert);
});
```

### Using `SubmitMyApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, submitMyApplicationRef, SubmitMyApplicationVariables } from '@fixhub/backend';

// The `SubmitMyApplication` mutation requires an argument of type `SubmitMyApplicationVariables`:
const submitMyApplicationVars: SubmitMyApplicationVariables = {
  fullName: ..., 
  contactNumber: ..., 
  city: ..., 
  yearsExperience: ..., 
  brands: ..., 
  specializations: ..., 
  experienceDescription: ..., 
  serviceType: ..., 
  coverageArea: ..., 
  workingDays: ..., 
  workingHours: ..., 
};

// Call the `submitMyApplicationRef()` function to get a reference to the mutation.
const ref = submitMyApplicationRef(submitMyApplicationVars);
// Variables can be defined inline as well.
const ref = submitMyApplicationRef({ fullName: ..., contactNumber: ..., city: ..., yearsExperience: ..., brands: ..., specializations: ..., experienceDescription: ..., serviceType: ..., coverageArea: ..., workingDays: ..., workingHours: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = submitMyApplicationRef(dataConnect, submitMyApplicationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.technicianApplication_insert);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_insert);
  console.log(data.applicationEvent_insert);
});
```

## AdminStartApplicationReview
You can execute the `AdminStartApplicationReview` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
adminStartApplicationReview(vars: AdminStartApplicationReviewVariables): MutationPromise<AdminStartApplicationReviewData, AdminStartApplicationReviewVariables>;

interface AdminStartApplicationReviewRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminStartApplicationReviewVariables): MutationRef<AdminStartApplicationReviewData, AdminStartApplicationReviewVariables>;
}
export const adminStartApplicationReviewRef: AdminStartApplicationReviewRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
adminStartApplicationReview(dc: DataConnect, vars: AdminStartApplicationReviewVariables): MutationPromise<AdminStartApplicationReviewData, AdminStartApplicationReviewVariables>;

interface AdminStartApplicationReviewRef {
  ...
  (dc: DataConnect, vars: AdminStartApplicationReviewVariables): MutationRef<AdminStartApplicationReviewData, AdminStartApplicationReviewVariables>;
}
export const adminStartApplicationReviewRef: AdminStartApplicationReviewRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminStartApplicationReviewRef:
```typescript
const name = adminStartApplicationReviewRef.operationName;
console.log(name);
```

### Variables
The `AdminStartApplicationReview` mutation requires an argument of type `AdminStartApplicationReviewVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AdminStartApplicationReviewVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `AdminStartApplicationReview` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminStartApplicationReviewData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AdminStartApplicationReviewData {
  technicianApplication_update?: TechnicianApplication_Key | null;
  applicationEvent_insert: ApplicationEvent_Key;
}
```
### Using `AdminStartApplicationReview`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminStartApplicationReview, AdminStartApplicationReviewVariables } from '@fixhub/backend';

// The `AdminStartApplicationReview` mutation requires an argument of type `AdminStartApplicationReviewVariables`:
const adminStartApplicationReviewVars: AdminStartApplicationReviewVariables = {
  id: ..., 
};

// Call the `adminStartApplicationReview()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminStartApplicationReview(adminStartApplicationReviewVars);
// Variables can be defined inline as well.
const { data } = await adminStartApplicationReview({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminStartApplicationReview(dataConnect, adminStartApplicationReviewVars);

console.log(data.technicianApplication_update);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
adminStartApplicationReview(adminStartApplicationReviewVars).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_update);
  console.log(data.applicationEvent_insert);
});
```

### Using `AdminStartApplicationReview`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, adminStartApplicationReviewRef, AdminStartApplicationReviewVariables } from '@fixhub/backend';

// The `AdminStartApplicationReview` mutation requires an argument of type `AdminStartApplicationReviewVariables`:
const adminStartApplicationReviewVars: AdminStartApplicationReviewVariables = {
  id: ..., 
};

// Call the `adminStartApplicationReviewRef()` function to get a reference to the mutation.
const ref = adminStartApplicationReviewRef(adminStartApplicationReviewVars);
// Variables can be defined inline as well.
const ref = adminStartApplicationReviewRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminStartApplicationReviewRef(dataConnect, adminStartApplicationReviewVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.technicianApplication_update);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_update);
  console.log(data.applicationEvent_insert);
});
```

## AdminRequestApplicationInformation
You can execute the `AdminRequestApplicationInformation` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
adminRequestApplicationInformation(vars: AdminRequestApplicationInformationVariables): MutationPromise<AdminRequestApplicationInformationData, AdminRequestApplicationInformationVariables>;

interface AdminRequestApplicationInformationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminRequestApplicationInformationVariables): MutationRef<AdminRequestApplicationInformationData, AdminRequestApplicationInformationVariables>;
}
export const adminRequestApplicationInformationRef: AdminRequestApplicationInformationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
adminRequestApplicationInformation(dc: DataConnect, vars: AdminRequestApplicationInformationVariables): MutationPromise<AdminRequestApplicationInformationData, AdminRequestApplicationInformationVariables>;

interface AdminRequestApplicationInformationRef {
  ...
  (dc: DataConnect, vars: AdminRequestApplicationInformationVariables): MutationRef<AdminRequestApplicationInformationData, AdminRequestApplicationInformationVariables>;
}
export const adminRequestApplicationInformationRef: AdminRequestApplicationInformationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminRequestApplicationInformationRef:
```typescript
const name = adminRequestApplicationInformationRef.operationName;
console.log(name);
```

### Variables
The `AdminRequestApplicationInformation` mutation requires an argument of type `AdminRequestApplicationInformationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AdminRequestApplicationInformationVariables {
  id: UUIDString;
  note: string;
}
```
### Return Type
Recall that executing the `AdminRequestApplicationInformation` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminRequestApplicationInformationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AdminRequestApplicationInformationData {
  technicianApplication_update?: TechnicianApplication_Key | null;
  applicationEvent_insert: ApplicationEvent_Key;
}
```
### Using `AdminRequestApplicationInformation`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminRequestApplicationInformation, AdminRequestApplicationInformationVariables } from '@fixhub/backend';

// The `AdminRequestApplicationInformation` mutation requires an argument of type `AdminRequestApplicationInformationVariables`:
const adminRequestApplicationInformationVars: AdminRequestApplicationInformationVariables = {
  id: ..., 
  note: ..., 
};

// Call the `adminRequestApplicationInformation()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminRequestApplicationInformation(adminRequestApplicationInformationVars);
// Variables can be defined inline as well.
const { data } = await adminRequestApplicationInformation({ id: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminRequestApplicationInformation(dataConnect, adminRequestApplicationInformationVars);

console.log(data.technicianApplication_update);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
adminRequestApplicationInformation(adminRequestApplicationInformationVars).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_update);
  console.log(data.applicationEvent_insert);
});
```

### Using `AdminRequestApplicationInformation`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, adminRequestApplicationInformationRef, AdminRequestApplicationInformationVariables } from '@fixhub/backend';

// The `AdminRequestApplicationInformation` mutation requires an argument of type `AdminRequestApplicationInformationVariables`:
const adminRequestApplicationInformationVars: AdminRequestApplicationInformationVariables = {
  id: ..., 
  note: ..., 
};

// Call the `adminRequestApplicationInformationRef()` function to get a reference to the mutation.
const ref = adminRequestApplicationInformationRef(adminRequestApplicationInformationVars);
// Variables can be defined inline as well.
const ref = adminRequestApplicationInformationRef({ id: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminRequestApplicationInformationRef(dataConnect, adminRequestApplicationInformationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.technicianApplication_update);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_update);
  console.log(data.applicationEvent_insert);
});
```

## AdminRejectApplication
You can execute the `AdminRejectApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
adminRejectApplication(vars: AdminRejectApplicationVariables): MutationPromise<AdminRejectApplicationData, AdminRejectApplicationVariables>;

interface AdminRejectApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminRejectApplicationVariables): MutationRef<AdminRejectApplicationData, AdminRejectApplicationVariables>;
}
export const adminRejectApplicationRef: AdminRejectApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
adminRejectApplication(dc: DataConnect, vars: AdminRejectApplicationVariables): MutationPromise<AdminRejectApplicationData, AdminRejectApplicationVariables>;

interface AdminRejectApplicationRef {
  ...
  (dc: DataConnect, vars: AdminRejectApplicationVariables): MutationRef<AdminRejectApplicationData, AdminRejectApplicationVariables>;
}
export const adminRejectApplicationRef: AdminRejectApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminRejectApplicationRef:
```typescript
const name = adminRejectApplicationRef.operationName;
console.log(name);
```

### Variables
The `AdminRejectApplication` mutation requires an argument of type `AdminRejectApplicationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AdminRejectApplicationVariables {
  id: UUIDString;
  note: string;
}
```
### Return Type
Recall that executing the `AdminRejectApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminRejectApplicationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AdminRejectApplicationData {
  technicianApplication_update?: TechnicianApplication_Key | null;
  applicationEvent_insert: ApplicationEvent_Key;
}
```
### Using `AdminRejectApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminRejectApplication, AdminRejectApplicationVariables } from '@fixhub/backend';

// The `AdminRejectApplication` mutation requires an argument of type `AdminRejectApplicationVariables`:
const adminRejectApplicationVars: AdminRejectApplicationVariables = {
  id: ..., 
  note: ..., 
};

// Call the `adminRejectApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminRejectApplication(adminRejectApplicationVars);
// Variables can be defined inline as well.
const { data } = await adminRejectApplication({ id: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminRejectApplication(dataConnect, adminRejectApplicationVars);

console.log(data.technicianApplication_update);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
adminRejectApplication(adminRejectApplicationVars).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_update);
  console.log(data.applicationEvent_insert);
});
```

### Using `AdminRejectApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, adminRejectApplicationRef, AdminRejectApplicationVariables } from '@fixhub/backend';

// The `AdminRejectApplication` mutation requires an argument of type `AdminRejectApplicationVariables`:
const adminRejectApplicationVars: AdminRejectApplicationVariables = {
  id: ..., 
  note: ..., 
};

// Call the `adminRejectApplicationRef()` function to get a reference to the mutation.
const ref = adminRejectApplicationRef(adminRejectApplicationVars);
// Variables can be defined inline as well.
const ref = adminRejectApplicationRef({ id: ..., note: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminRejectApplicationRef(dataConnect, adminRejectApplicationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.technicianApplication_update);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_update);
  console.log(data.applicationEvent_insert);
});
```

## AdminApproveApplication
You can execute the `AdminApproveApplication` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
adminApproveApplication(vars: AdminApproveApplicationVariables): MutationPromise<AdminApproveApplicationData, AdminApproveApplicationVariables>;

interface AdminApproveApplicationRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AdminApproveApplicationVariables): MutationRef<AdminApproveApplicationData, AdminApproveApplicationVariables>;
}
export const adminApproveApplicationRef: AdminApproveApplicationRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
adminApproveApplication(dc: DataConnect, vars: AdminApproveApplicationVariables): MutationPromise<AdminApproveApplicationData, AdminApproveApplicationVariables>;

interface AdminApproveApplicationRef {
  ...
  (dc: DataConnect, vars: AdminApproveApplicationVariables): MutationRef<AdminApproveApplicationData, AdminApproveApplicationVariables>;
}
export const adminApproveApplicationRef: AdminApproveApplicationRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the adminApproveApplicationRef:
```typescript
const name = adminApproveApplicationRef.operationName;
console.log(name);
```

### Variables
The `AdminApproveApplication` mutation requires an argument of type `AdminApproveApplicationVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AdminApproveApplicationVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `AdminApproveApplication` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AdminApproveApplicationData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AdminApproveApplicationData {
  technicianApplication_update?: TechnicianApplication_Key | null;
  technicianProfile_insert: TechnicianProfile_Key;
  user_update?: User_Key | null;
  applicationEvent_insert: ApplicationEvent_Key;
}
```
### Using `AdminApproveApplication`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, adminApproveApplication, AdminApproveApplicationVariables } from '@fixhub/backend';

// The `AdminApproveApplication` mutation requires an argument of type `AdminApproveApplicationVariables`:
const adminApproveApplicationVars: AdminApproveApplicationVariables = {
  id: ..., 
};

// Call the `adminApproveApplication()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await adminApproveApplication(adminApproveApplicationVars);
// Variables can be defined inline as well.
const { data } = await adminApproveApplication({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await adminApproveApplication(dataConnect, adminApproveApplicationVars);

console.log(data.technicianApplication_update);
console.log(data.technicianProfile_insert);
console.log(data.user_update);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
adminApproveApplication(adminApproveApplicationVars).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_update);
  console.log(data.technicianProfile_insert);
  console.log(data.user_update);
  console.log(data.applicationEvent_insert);
});
```

### Using `AdminApproveApplication`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, adminApproveApplicationRef, AdminApproveApplicationVariables } from '@fixhub/backend';

// The `AdminApproveApplication` mutation requires an argument of type `AdminApproveApplicationVariables`:
const adminApproveApplicationVars: AdminApproveApplicationVariables = {
  id: ..., 
};

// Call the `adminApproveApplicationRef()` function to get a reference to the mutation.
const ref = adminApproveApplicationRef(adminApproveApplicationVars);
// Variables can be defined inline as well.
const ref = adminApproveApplicationRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = adminApproveApplicationRef(dataConnect, adminApproveApplicationVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.technicianApplication_update);
console.log(data.technicianProfile_insert);
console.log(data.user_update);
console.log(data.applicationEvent_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.technicianApplication_update);
  console.log(data.technicianProfile_insert);
  console.log(data.user_update);
  console.log(data.applicationEvent_insert);
});
```

## CreateMyRepairRequest
You can execute the `CreateMyRepairRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
createMyRepairRequest(vars: CreateMyRepairRequestVariables): MutationPromise<CreateMyRepairRequestData, CreateMyRepairRequestVariables>;

interface CreateMyRepairRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CreateMyRepairRequestVariables): MutationRef<CreateMyRepairRequestData, CreateMyRepairRequestVariables>;
}
export const createMyRepairRequestRef: CreateMyRepairRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
createMyRepairRequest(dc: DataConnect, vars: CreateMyRepairRequestVariables): MutationPromise<CreateMyRepairRequestData, CreateMyRepairRequestVariables>;

interface CreateMyRepairRequestRef {
  ...
  (dc: DataConnect, vars: CreateMyRepairRequestVariables): MutationRef<CreateMyRepairRequestData, CreateMyRepairRequestVariables>;
}
export const createMyRepairRequestRef: CreateMyRepairRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the createMyRepairRequestRef:
```typescript
const name = createMyRepairRequestRef.operationName;
console.log(name);
```

### Variables
The `CreateMyRepairRequest` mutation requires an argument of type `CreateMyRepairRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CreateMyRepairRequestVariables {
  device: string;
  brand: string;
  model: string;
  problem: string;
  serviceType: ServiceType;
  location: string;
}
```
### Return Type
Recall that executing the `CreateMyRepairRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CreateMyRepairRequestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CreateMyRepairRequestData {
  repairRequest_insert: RepairRequest_Key;
}
```
### Using `CreateMyRepairRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, createMyRepairRequest, CreateMyRepairRequestVariables } from '@fixhub/backend';

// The `CreateMyRepairRequest` mutation requires an argument of type `CreateMyRepairRequestVariables`:
const createMyRepairRequestVars: CreateMyRepairRequestVariables = {
  device: ..., 
  brand: ..., 
  model: ..., 
  problem: ..., 
  serviceType: ..., 
  location: ..., 
};

// Call the `createMyRepairRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await createMyRepairRequest(createMyRepairRequestVars);
// Variables can be defined inline as well.
const { data } = await createMyRepairRequest({ device: ..., brand: ..., model: ..., problem: ..., serviceType: ..., location: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await createMyRepairRequest(dataConnect, createMyRepairRequestVars);

console.log(data.repairRequest_insert);

// Or, you can use the `Promise` API.
createMyRepairRequest(createMyRepairRequestVars).then((response) => {
  const data = response.data;
  console.log(data.repairRequest_insert);
});
```

### Using `CreateMyRepairRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, createMyRepairRequestRef, CreateMyRepairRequestVariables } from '@fixhub/backend';

// The `CreateMyRepairRequest` mutation requires an argument of type `CreateMyRepairRequestVariables`:
const createMyRepairRequestVars: CreateMyRepairRequestVariables = {
  device: ..., 
  brand: ..., 
  model: ..., 
  problem: ..., 
  serviceType: ..., 
  location: ..., 
};

// Call the `createMyRepairRequestRef()` function to get a reference to the mutation.
const ref = createMyRepairRequestRef(createMyRepairRequestVars);
// Variables can be defined inline as well.
const ref = createMyRepairRequestRef({ device: ..., brand: ..., model: ..., problem: ..., serviceType: ..., location: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = createMyRepairRequestRef(dataConnect, createMyRepairRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.repairRequest_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.repairRequest_insert);
});
```

## CancelMyRepairRequest
You can execute the `CancelMyRepairRequest` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
cancelMyRepairRequest(vars: CancelMyRepairRequestVariables): MutationPromise<CancelMyRepairRequestData, CancelMyRepairRequestVariables>;

interface CancelMyRepairRequestRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: CancelMyRepairRequestVariables): MutationRef<CancelMyRepairRequestData, CancelMyRepairRequestVariables>;
}
export const cancelMyRepairRequestRef: CancelMyRepairRequestRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
cancelMyRepairRequest(dc: DataConnect, vars: CancelMyRepairRequestVariables): MutationPromise<CancelMyRepairRequestData, CancelMyRepairRequestVariables>;

interface CancelMyRepairRequestRef {
  ...
  (dc: DataConnect, vars: CancelMyRepairRequestVariables): MutationRef<CancelMyRepairRequestData, CancelMyRepairRequestVariables>;
}
export const cancelMyRepairRequestRef: CancelMyRepairRequestRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the cancelMyRepairRequestRef:
```typescript
const name = cancelMyRepairRequestRef.operationName;
console.log(name);
```

### Variables
The `CancelMyRepairRequest` mutation requires an argument of type `CancelMyRepairRequestVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface CancelMyRepairRequestVariables {
  id: UUIDString;
}
```
### Return Type
Recall that executing the `CancelMyRepairRequest` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `CancelMyRepairRequestData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface CancelMyRepairRequestData {
  repairRequest_update?: RepairRequest_Key | null;
}
```
### Using `CancelMyRepairRequest`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, cancelMyRepairRequest, CancelMyRepairRequestVariables } from '@fixhub/backend';

// The `CancelMyRepairRequest` mutation requires an argument of type `CancelMyRepairRequestVariables`:
const cancelMyRepairRequestVars: CancelMyRepairRequestVariables = {
  id: ..., 
};

// Call the `cancelMyRepairRequest()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await cancelMyRepairRequest(cancelMyRepairRequestVars);
// Variables can be defined inline as well.
const { data } = await cancelMyRepairRequest({ id: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await cancelMyRepairRequest(dataConnect, cancelMyRepairRequestVars);

console.log(data.repairRequest_update);

// Or, you can use the `Promise` API.
cancelMyRepairRequest(cancelMyRepairRequestVars).then((response) => {
  const data = response.data;
  console.log(data.repairRequest_update);
});
```

### Using `CancelMyRepairRequest`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, cancelMyRepairRequestRef, CancelMyRepairRequestVariables } from '@fixhub/backend';

// The `CancelMyRepairRequest` mutation requires an argument of type `CancelMyRepairRequestVariables`:
const cancelMyRepairRequestVars: CancelMyRepairRequestVariables = {
  id: ..., 
};

// Call the `cancelMyRepairRequestRef()` function to get a reference to the mutation.
const ref = cancelMyRepairRequestRef(cancelMyRepairRequestVars);
// Variables can be defined inline as well.
const ref = cancelMyRepairRequestRef({ id: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = cancelMyRepairRequestRef(dataConnect, cancelMyRepairRequestVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.repairRequest_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.repairRequest_update);
});
```

