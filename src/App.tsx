import { MiradentProvider } from './context'
import AppContent from './app/AppContent'

export default function App() {
	return (
		<MiradentProvider>
			<AppContent />
		</MiradentProvider>
	)
}
