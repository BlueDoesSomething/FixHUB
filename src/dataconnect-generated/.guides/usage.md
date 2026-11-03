# Basic Usage

Always prioritize using a supported framework over using the generated SDK
directly. Supported frameworks simplify the developer experience and help ensure
best practices are followed.





## Advanced Usage
If a user is not using a supported framework, they can use the generated SDK directly.

Here's an example of how to use it with the first 5 operations:

```js
import { createMyProfile, updateMyProfile, submitMyApplication, adminStartApplicationReview, adminRequestApplicationInformation, adminRejectApplication, adminApproveApplication, createMyRepairRequest, cancelMyRepairRequest, getMyProfile } from '@fixhub/backend';


// Operation CreateMyProfile:  For variables, look at type CreateMyProfileVars in ../index.d.ts
const { data } = await CreateMyProfile(dataConnect, createMyProfileVars);

// Operation UpdateMyProfile:  For variables, look at type UpdateMyProfileVars in ../index.d.ts
const { data } = await UpdateMyProfile(dataConnect, updateMyProfileVars);

// Operation SubmitMyApplication:  For variables, look at type SubmitMyApplicationVars in ../index.d.ts
const { data } = await SubmitMyApplication(dataConnect, submitMyApplicationVars);

// Operation AdminStartApplicationReview:  For variables, look at type AdminStartApplicationReviewVars in ../index.d.ts
const { data } = await AdminStartApplicationReview(dataConnect, adminStartApplicationReviewVars);

// Operation AdminRequestApplicationInformation:  For variables, look at type AdminRequestApplicationInformationVars in ../index.d.ts
const { data } = await AdminRequestApplicationInformation(dataConnect, adminRequestApplicationInformationVars);

// Operation AdminRejectApplication:  For variables, look at type AdminRejectApplicationVars in ../index.d.ts
const { data } = await AdminRejectApplication(dataConnect, adminRejectApplicationVars);

// Operation AdminApproveApplication:  For variables, look at type AdminApproveApplicationVars in ../index.d.ts
const { data } = await AdminApproveApplication(dataConnect, adminApproveApplicationVars);

// Operation CreateMyRepairRequest:  For variables, look at type CreateMyRepairRequestVars in ../index.d.ts
const { data } = await CreateMyRepairRequest(dataConnect, createMyRepairRequestVars);

// Operation CancelMyRepairRequest:  For variables, look at type CancelMyRepairRequestVars in ../index.d.ts
const { data } = await CancelMyRepairRequest(dataConnect, cancelMyRepairRequestVars);

// Operation GetMyProfile: 
const { data } = await GetMyProfile(dataConnect);


```