export function navigate(path: string): void {
	if (window.location.pathname !== path) {
		window.history.pushState({}, "", path);
		window.dispatchEvent(new PopStateEvent("popstate"));
	}
}
