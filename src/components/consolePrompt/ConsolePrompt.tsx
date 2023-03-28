import styles from "./ConsolePrompt.module.css"

export default function ConsolePrompt({ prompt }: { prompt: string }) {
  // console.log(prompt)
  let parts = prompt.split("@")
  const user = parts[0]
  parts = parts[1].split(":")
  const host = parts[0]
  const path = parts[1].slice(0, -1)
  return <>
    <span className={styles.userSpan}>{user}</span>
    <span className={styles.specialSpans}>@</span>
    <span className={styles.hostSpan}>{host}</span>
    <span className={styles.specialSpans}>:</span>
    <span className={styles.pathSpan}>{path}</span>
    <span className={styles.specialSpans} style={{ "paddingRight": "0.5rem"}}>$</span>
  </>
}