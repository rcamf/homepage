import ConsolePrompt from "@components/consolePrompt/ConsolePrompt"
import styles from "@components/styles/Console.module.css"
import HistoryElement from "@interfaces/DisplayElement"

export default function ConsoleCommand({ value, prompt }: { value: string, prompt: string }) {
  return <div className={styles.elementDiv}>
    <ConsolePrompt prompt={prompt} />
    <span className={styles.elementSpan}>{value}</span>
  </div>
}