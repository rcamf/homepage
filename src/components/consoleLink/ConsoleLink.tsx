import styles from "./ConsoleLink.module.css"
import { MouseEventHandler } from "react"

export default function ConsoleLink({ url, text }: { url: string, text: string }) {
  const clickLink: MouseEventHandler<HTMLAnchorElement> = (event) => {
    if (event.ctrlKey) {
      window.open(url)
    }
  }

  return <a className={styles.consoleLink} onClick={clickLink}>{text}
    <span className={styles.tooltipSpan}>Ctrl+Click</span>
  </a>
}