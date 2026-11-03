// TODO: replace each mock with a real api call once the backend has the
// endpoints. Until then every call waits, then succeeds or fails.
const wait = (ms = 900) => new Promise((resolve) => setTimeout(resolve, ms));

async function mock(result, simulateFail) {
  await wait();
  if (simulateFail) throw new Error("Request failed");
  return result;
}

export const postUpdate = (message, { simulateFail = false } = {}) =>
  mock({ message }, simulateFail);

export const saveMilestone = (values, { simulateFail = false } = {}) =>
  mock(values, simulateFail);

export const requestNewDate = (values, { simulateFail = false } = {}) =>
  mock(values, simulateFail);

export const requestHandover = (values, { simulateFail = false } = {}) =>
  mock(values, simulateFail);

export const releaseRole = (values, { simulateFail = false } = {}) =>
  mock(values, simulateFail);
