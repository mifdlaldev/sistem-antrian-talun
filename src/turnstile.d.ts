interface TurnstileWidget {
	render: (
		container: string | HTMLElement,
		options: Record<string, unknown>,
	) => string;
	reset: (widgetId?: string) => void;
	remove: (widgetId?: string) => void;
}

interface Window {
	turnstile?: TurnstileWidget;
}
