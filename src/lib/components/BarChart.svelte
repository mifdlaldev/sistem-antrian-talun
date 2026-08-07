<script lang="ts">
import { cn } from "$lib/utils";

interface BarDatum {
	label: string;
	value: number;
	color?: string;
}

let {
	data = $bindable([]),
	height = 200,
	direction = "vertical",
	class: className,
}: {
	data: BarDatum[];
	height?: number;
	direction?: "vertical" | "horizontal";
	class?: string;
} = $props();
</script>

{#if direction === 'vertical'}
	<svg
		width="100%"
		{height}
		viewBox="0 0 100 {height}"
		preserveAspectRatio="none"
		class={cn('overflow-visible', className)}
	>
		{#each data as item, i (i)}
			{@const max = Math.max(...data.map((d) => d.value), 1)}
			{@const barH = (item.value / max) * (height - 24)}
			<rect
				x={i * (100 / data.length) + 4}
				y={height - barH - 18}
				width={100 / data.length - 8}
				height={barH}
				rx="2"
				fill={item.color ?? 'var(--color-chart-1)'}
			/>
			<text
				x={i * (100 / data.length) + 50 / data.length}
				y={height - 8}
				text-anchor="middle"
				class="fill-muted-foreground text-[4px]"
			>
				{item.label}
			</text>
		{/each}
	</svg>
{:else}
	<div class="flex flex-col gap-2">
		{#each data as item (item.label)}
			{@const max = Math.max(...data.map((d) => d.value), 1)}
			{@const barW = (item.value / max) * 100}
			<div class="flex items-center gap-3">
				<span class="w-24 flex-shrink-0 truncate text-xs text-muted-foreground">{item.label}</span>
				<div class="h-4 flex-1 overflow-hidden rounded bg-muted">
					<div
						class="h-full rounded transition-all"
						style="width: {barW}%; background-color: {item.color ?? 'var(--color-chart-1)'}"
					></div>
				</div>
				<span class="w-8 flex-shrink-0 text-right text-xs font-medium">{item.value}</span>
			</div>
		{/each}
	</div>
{/if}
