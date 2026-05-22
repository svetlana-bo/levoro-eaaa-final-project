// Session-scoped "view as" override for Stage 3 Levoro Admin → Company portal.
// Mari clicks "View as admin" on a company detail page; we store the company
// id so Stage 2 surfaces (`getCurrentCompanyId`) route to that company until
// Mari exits view-as.

const KEY = "b2b.viewAsCompanyId";
const EVT = "b2b.viewAs.change";

export function getViewAsCompanyId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(KEY);
}

export function setViewAsCompanyId(id: string) {
  sessionStorage.setItem(KEY, id);
  window.dispatchEvent(new Event(EVT));
}

export function clearViewAsCompanyId() {
  sessionStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVT));
}

export function subscribeViewAs(cb: () => void): () => void {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}
