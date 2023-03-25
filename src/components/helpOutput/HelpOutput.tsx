import styles from "@components/styles/Console.module.css"

export default function HelpOutput({ prompt, value }: { prompt: string, value: string }) {
  return <div className={styles.elementDiv}>
    <span>
      {value.split(" ")[0]}
    </span>
    <span className={styles.elementSpan}>
      {value.split(" ").slice(1).join(" ")}
    </span>
  </div>
}