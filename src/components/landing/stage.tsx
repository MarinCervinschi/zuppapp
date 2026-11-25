import { Canvas } from "@react-three/fiber";

import { World } from "./world";

// The canvas behind the words: its own chunk, loaded after the page, so three.js never weighs on
// the first paint or on the rest of the app. `onReady` fires on the first frame it draws.

export default function Stage({
	podiumCount,
	onReady,
}: {
	podiumCount: number;
	onReady: () => void;
}) {
	return (
		<Canvas
			dpr={[1, 1.5]}
			flat
			gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
			camera={{ fov: 20, near: 0.5, far: 80, position: [0, 15, 0.01] }}
		>
			<World podiumCount={podiumCount} onReady={onReady} />
		</Canvas>
	);
}
