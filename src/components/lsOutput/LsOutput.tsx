import styles from "@components/styles/Console.module.css"
import { MouseEventHandler } from "react"

export default function LsOutput({ value, prompt }: { value: string, prompt: string }) {
  const folder = JSON.parse(value)

  const clickLink: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (event.ctrlKey) {
      window.open(folder.url)
    }
  }

  return <div className={styles.elementDiv}>
    <span className={folder.folder ? styles.folderSpan : styles.fileSpan}>
      {!folder.folder && folder.url !== null ?
        <a className={styles.consoleLink} onClick={clickLink}>{folder.key}
          <span className={styles.tooltipSpan}>Ctrl+Click</span>
        </a>
        : folder.key}
    </span>
    <span className={styles.elementSpan}>{folder.description}</span>
  </div>
}