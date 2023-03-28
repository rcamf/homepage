import ConsoleLink from "@components/consoleLink/ConsoleLink"
import ConsolePrompt from "@components/consolePrompt/ConsolePrompt"
import DisplayElement from "@interfaces/DisplayElement"
import styles from "./ConsoleOutput.module.css"

export default function ConsoleOutput({ data }: { data: DisplayElement }) {
  const content: any[] = JSON.parse(data.value)
  // console.log(content)
  const hasPrompt = data.prompt ? 0 : 1
  let style
  switch (content[0].style) {
    case "folder":
      style = styles.folderSpan
      break;
    case "error":
      style = styles.errorSpan
      break
    case "file":
      style = styles.fileSpan
      break
    default:
      style = styles.normalSpan
      break;
  }

  return <div className={styles.elementDiv}>
    {
      data.prompt ?
        <ConsolePrompt prompt={data.prompt} />
        : <span className={`${style} ${styles.elementSpan}`}>
          {
            content[0].url ?
              <ConsoleLink url={content[0].url} text={content[0].value} />
              : content[0].value
          }
        </span>
    }
    {
      content.slice(hasPrompt).map((element, idx) => <span key={idx} className={styles.elementSpan}>
        {
          content[idx + hasPrompt].url ?
            <ConsoleLink url={content[idx + hasPrompt].url} text={content[idx + hasPrompt].value} />
            : content[idx + hasPrompt].value
        }
      </span>)
    }
  </div>
}