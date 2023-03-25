import { useState, useRef, useEffect } from "react"
import styles from "@components/styles/Console.module.css"
import { KeyboardEvent } from "react"
import DisplayElement from "@interfaces/DisplayElement"
import ConsoleCommand from "@components/consoleCommand/ConsoleCommand"
import ConsolePrompt from "@components/consolePrompt/ConsolePrompt"
import LsOutput from "@components/lsOutput/LsOutput"
import ErrorOutput from "@components/errorOutput/ErrorOutput"
import FileStructure from "@interfaces/FileStructure"
import HelpOutput from "@components/helpOutput/HelpOutput"

export default function Console(props: { pages: string[] }) {
  let ROOT_FILE_STRUCTURE = {
    pages: {
      children: props.pages.reduce((prevObject, page) => ({
        ...prevObject, [page]: {
          folder: false
        }
      }), {}),
      folder: true,
      description: "All of the fun on this website."
    },
    projects: {
      folder: true,
      children: {},
      description: "Overview of my github projects."
    },
    articles: {
      folder: true,
      children: {},
      description: "Link to all my articles available online."
    },
    socials: {
      folder: true,
      children: {},
      description: "If you haven't got enough of me, my socials."
    }
  }

  const HISTORY_LENGTH = 10

  const [path, setPath] = useState<string>("/")
  const [displayArray, setDisplayArray] = useState<DisplayElement[]>([])
  const [commandHistory, setCommandHistory] = useState<{
    index: number,
    history: string[]
  }>({
    index: -1,
    history: []
  })
  const [fileSystem, updateFileSystem] = useState<{
    root: FileStructure,
    current: FileStructure
  }>({
    root: ROOT_FILE_STRUCTURE,
    current: ROOT_FILE_STRUCTURE
  })

  const getDirectory = (targetPath: string, currentDirectory: FileStructure) => {
    let startDirectory = currentDirectory
    const steps = targetPath.split("/")
    console.log(steps)
    steps.forEach((step, idx) => {
      if (step !== "" && step !== ".") {
        console.log(idx, step, currentDirectory)
        if (step !== "..") {
          if (currentDirectory.hasOwnProperty(step)) {
            if (!currentDirectory[step].folder) {
              throw new Error(`ERROR: ${steps.slice(0, idx + 1).join("/")} is not a folder.`)
            }
            currentDirectory = currentDirectory[step].children
          } else {
            throw new Error(`ERROR: ${targetPath} could not be found. Use 'ls' to check out available paths.`)
          }
        } else {
          currentDirectory = getDirectory(steps.slice(0, idx - 1 > 0 ? idx - 1 : 0).join("/"), fileSystem.root)
        }
      }
    })
    return currentDirectory
  }

  const parseInputPath = (inputPath: string) => {
    const components = inputPath.split("/")
    console.log(path.slice(1).split("/"))
    const parsedPathComponents: string[] = components[0] === "" || path === "/" ? [] : path.slice(1).split("/")
    components.forEach(component => {
      if (component == "..") {
        parsedPathComponents.pop()
      } else if (!["", "."].includes(component)) {
        parsedPathComponents.push(component)
      }
    })
    console.log(components, parsedPathComponents)
    if (components[0] === "" || path === "/") {
      return "/" + parsedPathComponents.join("/")
    } else {
      return "/" + parsedPathComponents.join("/")
    }
  }

  const clickOnConsole = () => {
    if (consoleInputRef.current) {
      consoleInputRef.current.focus()
    }
  }

  const getDirectoryDescription = (args: string, currentDirectory: FileStructure) => {
    const argsSplit = args !== "" ? args.split("/") : path.split("/")
    // console.log(argsSplit)
    return getDirectory(argsSplit.slice(0, argsSplit.length - 2).join("/"), fileSystem.root)[argsSplit[argsSplit.length - 1]].description
  }

  const commands: {
    [key: string]: {
      run: Function,
      description: string
    }
  } = {
    ls: {
      run: (args: string) => {
        const currentDirectory = fileSystem.current
        let outputDirectory = currentDirectory
        let directoryDescription = path === "/" ? "Root Directory" : getDirectoryDescription(args, currentDirectory)
        let directoryPath = ""
        if (args !== "" && path === "/") {
          try {
            outputDirectory = getDirectory(args, currentDirectory)
            const argsSplit = args.split("/")
            directoryDescription = getDirectoryDescription(args, currentDirectory)
            directoryPath = argsSplit.join("/")
            console.log(path)
          } catch (error: any) {
            return [
              {
                value: error.message,
                prompt: consolePrompt,
                component: ErrorOutput
              }
            ]
          }
        }
        const newArray = [
          {
            value: JSON.stringify({
              folder: true,
              description: directoryDescription,
              key: "./" + directoryPath
            }),
            prompt: consolePrompt,
            component: LsOutput
          },
          ...Object.keys(outputDirectory).sort().map(key => ({
            value: JSON.stringify({
              ...outputDirectory[key],
              key
            }),
            prompt: consolePrompt,
            component: LsOutput
          }))
        ]
        return newArray
      },
      description: "Show the content of the specified directory (If none is specified the current one)."
    },
    cd: {
      run: (args: string) => {
        if (args === "") {
          updateFileSystem({
            ...fileSystem,
            current: fileSystem.root
          })
          return []
        }
        try {
          const resultDirectory = getDirectory(args, fileSystem.current)
          const newPath = parseInputPath(args)
          setPath(newPath)
          updateFileSystem({
            ...fileSystem,
            current: resultDirectory
          })
          return []
        } catch (error: any) {
          return [
            {
              value: error.message,
              prompt: consolePrompt,
              component: ErrorOutput
            }
          ]
        }
      },
      description: "Navigate to another directory e.g. 'cd <PATH>' (No specification of the path brings you to root)."
    },
    help: {
      run: () => {
        return Object.keys(commands).sort().map(command => ({
          value: `${command}: ${commands[command].description}`,
          prompt: consolePrompt,
          component: HelpOutput
        }))
      },
      description: "Opens this helpful explanation."
    },
    clear: {
      run: () => {
        setDisplayArray([])
      },
      description: "Clears all previous console outputs."
    }
  }

  const consoleInputRef = useRef<HTMLInputElement>(null)
  const consolePrompt = `user@rfelten.de:${path}$`

  useEffect(() => {
    if (consoleInputRef.current) {
      consoleInputRef.current.focus()
    }
    setPath("/")
    fetch("https://api.github.com/users/rcamf/repos")
      .then(res => res.json())
      .then(result => {
        ROOT_FILE_STRUCTURE.projects = {
          ...ROOT_FILE_STRUCTURE.projects,
          children: result.reduce((prevObject: {}, repo: { html_url: any; description: any; name: any }) => ({
            ...prevObject, [repo.name]: {
              description: repo.description,
              folder: false,
              url: repo.html_url
            }
          }), {})
        }
        updateFileSystem({
          root: ROOT_FILE_STRUCTURE,
          current: ROOT_FILE_STRUCTURE
        })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleEnter(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault()
      if (consoleInputRef.current) {
        const args = consoleInputRef.current.value !== "" ? consoleInputRef.current.value.split(" ") : [""]
        if (args[0] !== "") {
          setCommandHistory({
            index: -1,
            history: [
              consoleInputRef.current.value,
              ...commandHistory.history.slice(0, HISTORY_LENGTH - 1)
            ]
          })
        }
        consoleInputRef.current.value = ""
        let outputElements: DisplayElement[] = [
          ...displayArray,
          {
            value: args.join(" "),
            prompt: consolePrompt,
            component: ConsoleCommand
          }
        ]
        if (args[0] === "ls") {
          outputElements.push(...commands.ls.run(args.length > 1 ? args[1] : ""))
        } else if (args[0] === "cd") {
          outputElements.push(...commands.cd.run(args.length > 1 ? args[1] : ""))
        } else if (args[0] === "clear") {
          commands.clear.run()
          outputElements = []
        } else if (args[0] === "help") {
          outputElements.push(...commands.help.run())
        } else {
          outputElements.push({
            value: `ERROR: ${args[0] === "" ? "Enter a valid" : `${args[0]} is an invalid`} command. Use help to get an overview.`,
            prompt: consolePrompt,
            component: ErrorOutput
          })
        }
        setDisplayArray([
          ...outputElements
        ])

      }
    } else if (event.key === "Tab") {
      console.log("TAB")
      event.preventDefault()
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      if (consoleInputRef.current) {
        if (commandHistory.index < HISTORY_LENGTH - 1 && commandHistory.index < commandHistory.history.length - 1) {
          consoleInputRef.current.value = commandHistory.history[commandHistory.index + 1]
          setCommandHistory({
            history: commandHistory.history,
            index: commandHistory.index + 1
          })
        }
      }
    } else if (event.key === "ArrowDown") {
      event.preventDefault()
      let history = commandHistory
      if (consoleInputRef.current) {
        if (commandHistory.index > 0) {
          consoleInputRef.current.value = commandHistory.history[commandHistory.index - 1]
          history.index -= 1
        } else if (commandHistory.index === 0) {
          consoleInputRef.current.value = ""
          history.index -= 1
        }
      }
      setCommandHistory(history)
    }
  }

  return <div className={styles.consoleWrapper} onClick={clickOnConsole}>
    <div className={styles.consoleDiv}>
      {displayArray.map((element, key) => {
        return <element.component key={key} value={element.value} prompt={element.prompt} />
      })}
      <div className={styles.elementDiv}>
        <ConsolePrompt prompt={consolePrompt} />
        <input type="text" ref={consoleInputRef} onKeyDown={handleEnter} />
      </div>
    </div>
  </div>
}