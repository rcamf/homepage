import { useState, useRef, useEffect } from "react"
import styles from "./Console.module.css"
import { KeyboardEvent } from "react"
import DisplayElement from "@interfaces/DisplayElement"
import ConsolePrompt from "@components/consolePrompt/ConsolePrompt"
import FileStructure from "@interfaces/FileStructure"
import ConsoleOutput from "@components/consoleOutput/ConsoleOutput"
import fileStrucure from "@root/fileStructure.json"
import commands from "@root/commands.json"

// Constans specific to this application level
let ROOT_FILE_STRUCTURE: FileStructure = fileStrucure // Initial file system
const COMMANDS: {
  [key: string]: any
} = commands // The description of available commands
const HISTORY_LENGTH = 100 // Number of executed commands kept in history
const DISPLAY_SIZE = 100 // Maximum number of displayed console rows

export default function Console() {
  // State
  const [path, setPath] = useState<string>("/") // Current console path
  const [displayArray, setDisplayArray] = useState<DisplayElement[]>([]) // Array of currently displayed elements
  const [commandHistory, setCommandHistory] = useState<{
    index: number,
    history: string[]
  }>({
    index: -1,
    history: []
  }) // History of executed commands
  const [fileSystem, updateFileSystem] = useState<{
    root: FileStructure,
    current: FileStructure
  }>({
    root: ROOT_FILE_STRUCTURE,
    current: ROOT_FILE_STRUCTURE
  }) // The file system we are operating in

  // Refs
  const consoleInputRef = useRef<HTMLInputElement>(null) // Console Input Element Ref
  const consolePrompt = useRef(`user@rfelten.de:${path}$`) // Console Prompt Ref

  // React Hooks
  useEffect(() => {
    if (consoleInputRef.current) {
      consoleInputRef.current.focus()
    }
    consolePrompt.current = `user@${window.location.hostname}:${path}$`
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

  // Utility functions
  // Traverses the path supplied, starting at the current directory
  const getDirectory = (path: string, currentDirectory: FileStructure) => {
    let startDirectory = currentDirectory
    const steps = path.split("/")
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
            throw new Error(`ERROR: ${path} could not be found. Use 'ls' to check out available paths.`)
          }
        } else {
          const parsedPath = parseInputPath(steps.slice(0, idx + 1).join("/"))
          currentDirectory = getDirectory(parsedPath, fileSystem.root)
        }
      }
    })
    return currentDirectory
  }
  
  // Generates the value for the error HistoryElement
  const getErrorOutputElements = (message: string) => {
    const splitIndex = message.indexOf(" ")
    return JSON.stringify([
      {
        value: message.slice(0, splitIndex),
        style: "error"
      },
      {
        value: message.slice(splitIndex + 1)
      }
    ])
  }

  // Get the description of the supplied path
  const getDescription = (descriptionPath: string) => {
    const argsSplit = descriptionPath !== "" ? descriptionPath.split("/") : path.split("/")
    // console.log(argsSplit)
    return getDirectory(argsSplit.slice(0, argsSplit.length - 2).join("/"), fileSystem.root)[argsSplit[argsSplit.length - 1]].description
  }

  // Prettify paths
  const parseInputPath = (inputPath: string) => {
    const components = inputPath.split("/")
    // console.log(path.slice(1).split("/"))
    const parsedPathComponents: string[] = components[0] === "" || path === "/" ? [] : path.slice(1).split("/")
    components.forEach(component => {
      if (component == "..") {
        parsedPathComponents.pop()
      } else if (!["", "."].includes(component)) {
        parsedPathComponents.push(component)
      }
    })
    // console.log(components, parsedPathComponents)
    if (components[0] === "" || path === "/") {
      return "/" + parsedPathComponents.join("/")
    } else {
      return "/" + parsedPathComponents.join("/")
    }
  }

  // DOM modifying functions
  // Focus the console input onClick
  const clickOnConsole = () => {
    if (consoleInputRef.current) {
      consoleInputRef.current.focus()
    }
  }

  // Handle keyboard inputs on console
  const handleKeyboardInput = (event: KeyboardEvent) => {
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
          {
            value: JSON.stringify([{
              value: args.join(" ")
            }]),
            prompt: consolePrompt.current,
          }
        ]
        if (args[0] === "ls") {
          outputElements.push(...ls(args.length > 1 ? args[1] : ""))
        } else if (args[0] === "cd") {
          outputElements.push(...cd(args.length > 1 ? args[1] : ""))
        } else if (args[0] === "clear") {
          clear()
          return
        } else if (args[0] === "help") {
          outputElements.push(...help())
        } else {
          outputElements.push({
            value: JSON.stringify([
              {
                value: "ERROR:",
                style: "error"
              },
              {
                value: `${args[0] === "" ? "Enter a valid" : `${args[0]} is an invalid`} command. Use help to get an overview.`
              }
            ])
          })
        }
        setDisplayArray([
          ...displayArray.slice(displayArray.length + outputElements.length > DISPLAY_SIZE ? displayArray.length + outputElements.length - DISPLAY_SIZE : 0),
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

  // Command Functions
  // ls command
  const ls = (args: string) => {
    const currentDirectory = fileSystem.current
    let outputDirectory = currentDirectory
    let directoryDescription = path === "/" ? "Root Directory" : getDescription(args)
    let directoryPath = ""
    if (args !== "" && path === "/") {
      try {
        outputDirectory = getDirectory(args, currentDirectory)
        const argsSplit = args.split("/")
        directoryDescription = getDescription(args)
        directoryPath = argsSplit.join("/")
        // console.log(path)
      } catch (error: any) {
        return [
          {
            value: getErrorOutputElements(error.message)
          }
        ]
      }
    }
    const newArray = [
      {
        value: JSON.stringify([
          {
            style: "folder",
            value: "./" + directoryPath
          }
          , {
            value: directoryDescription
          }
        ])
      },
      ...Object.keys(outputDirectory).sort().map(key => ({
        value: JSON.stringify([
          {
            value: key,
            style: outputDirectory[key].folder ? "folder" : "file",
            url: outputDirectory[key].url
          },
          {
            value: outputDirectory[key].description
          }
        ])
      }))
    ]
    return newArray
  }

  // CD COMMAND
  const cd = (path: string) => {
    if (path === "") {
      updateFileSystem({
        ...fileSystem,
        current: fileSystem.root
      })
      setPath("/")
      consolePrompt.current = `${consolePrompt.current.split(":")[0]}:/$`
      return []
    }
    try {
      const resultDirectory = getDirectory(path, fileSystem.current)
      const newPath = parseInputPath(path)
      setPath(newPath)
      consolePrompt.current = `${consolePrompt.current.split(":")[0]}:${newPath}$`
      updateFileSystem({
        ...fileSystem,
        current: resultDirectory
      })
      return []
    } catch (error: any) {
      return [
        {
          value: getErrorOutputElements(error.message)
        }
      ]
    }
  }

  // HELP COMMAND
  const help = () => {
    return Object.keys(COMMANDS).sort().map(command => ({
      value: JSON.stringify([
        {
          value: `${command}:`
        },
        {
          value: `${COMMANDS[command].description}`
        }
      ])
    }))
  }

  // CLEAR COMMAND 
  const clear = () => {
    setDisplayArray([])
  }

  // Rendered HTML
  return <div className={styles.consoleWrapper} onClick={clickOnConsole}>
    <div className={styles.consoleDiv}>
      {displayArray.map((element, key) => {
        return <ConsoleOutput key={key} data={element} />
      })}
      <div className={styles.elementDiv}>
        <ConsolePrompt prompt={consolePrompt.current} />
        <input type="text" ref={consoleInputRef} onKeyDown={handleKeyboardInput} />
      </div>
    </div>
  </div>
}