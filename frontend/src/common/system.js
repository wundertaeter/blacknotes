import { Store } from "src/store";

let updateLoadingTimeout = null;
export function loading(loading) {
  if (updateLoadingTimeout) clearTimeout(updateLoadingTimeout);
  if (loading) {
    Store.commit("user/updateLoading", true);
  } else {
    updateLoadingTimeout = setTimeout(() => {
      Store.commit("user/updateLoading", false);
    }, 500);
  }
}