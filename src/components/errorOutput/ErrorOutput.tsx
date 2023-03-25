import styles from "@components/styles/Console.module.css"

export default function ErrorOutput({ value, prompt }: { value: string, prompt: string }) {
  const firstSpace = value.indexOf(" ") 
  const content = [value.substring(0, firstSpace), value.slice(firstSpace + 1)]
  return <div className={styles.elementDiv}>
    <span className={styles.errorSpan}>
      {content[0]}
    </span>
    <span className={styles.elementSpan}>
      {content[1]}
    </span>
  </div>
}