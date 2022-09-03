import {createEffect, createSignal, For, onCleanup, onMount, Show} from "solid-js";
import {CompletionAwaitingQueue, QueueJob} from "./CompletionAwaitingQueue";

interface ImageConfiguration {
    cfgscale: string;
    initimg: null;
    seed: string;
    width: string;
    prompt: string;
    steps: string;
    iterations: string;
    height: string
}

const [currentProcessedElement, setCurrentProcessedElement] = createSignal<ImageConfiguration | undefined>(undefined)

const myTaskQueue = new CompletionAwaitingQueue<ImageConfiguration, any>(
    (i) => requestImage(i),
    () => {
        const l = latestConfig()
        if (l == null) return []
        return [{
            value: l,
            onError: (e) => console.error(e),
            onDone: (r) => console.log(r)
        }]
    },
    (n) => {
        setCurrentProcessedElement(n)
    }
)


function enqueueImageConfiguration(i: ImageConfiguration) {
    myTaskQueue.enqueue({
        value: i,
        onError: (e) => console.error(e),
        onDone: (r) => console.log(r)
    })
}

async function requestImage(i: ImageConfiguration) {
    const stringified = JSON.stringify(i)
    console.log(stringified)
    const response = await fetch(endpoint(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: stringified
    })
    const json = await response.json()
    console.log('Success', json)
    setImages([json, ...images()])
}

function handleSubmit(e: Event) {
    const obj: ImageConfiguration = {
        cfgscale: `${cfgScale()}`,
        height: `${height()}`,
        initimg: null,
        iterations: `${iterations()}`,
        prompt: `${prompt()}`,
        seed: `${seed()}`,
        steps: `${steps()}`,
        width: `${width()}`
    }
    setLatestConfig(obj)
    enqueueImageConfiguration(obj)
    console.log(obj);

    e.preventDefault()
    return false;
}

const [images, setImages] = createSignal<Array<any>>([])

const [cfgScale, setCfgScale] = createSignal(7.5)
const [height, setHeight] = createSignal(64)
const [width, setWidth] = createSignal(64)
const [iterations, setIterations] = createSignal(1)
const [prompt, setPrompt] = createSignal("")
const [seed, setSeed] = createSignal(-1)
const [steps, setSteps] = createSignal(100)
const [latestConfig, setLatestConfig] = createSignal<ImageConfiguration | null>(null)

const [shouldShowSetup, setShowSetup] = createSignal(true)

function SetupInstruction() {
    return <>
        <h2 onClick={() => setShowSetup(true)}>Setup</h2>
        <Show when={shouldShowSetup()}>
            <ul>

                <li>Install the <a href={"https://github.com/lstein/stable-diffusion"}>lstein/stable-diffusion</a> fork
                    on your machine. (I followed <a
                        href={"https://www.youtube.com/watch?v=ZCJpIDADzTI"}>this</a> tutorial.)
                </li>
                <li>Patch the webserver to accept cross-origin requests. Either copy <a
                    href={"https://gist.github.com/SebastianAigner/bd1da9f1210e419a4a53c8ae4275a102"}>dream_web_patched.py</a> into
                    your scripts folder or manually apply the changes to your dream_web.py file.
                </li>
                <li>In your browser, click the lock icon 🔒 in the URL bar, and select "Site settings". Switch "Insecure content" to "Allow". This allows this website to communicate with the stable-diffusion server running locally on your machine.</li>
                <li>Run your application and move on to the "Configuration" section.</li>
                <li onClick={() => setShowSetup(false)}><i>Click here to hide these instructions.</i></li>

            </ul>
        </Show>
    </>
}

const [shouldShowConfig, setShowConfig] = createSignal(true)
const savedEndpoint = localStorage.getItem("endpoint") ?? "http://localhost:9090/"
const [endpoint, setEndpoint] = createSignal<string>(savedEndpoint)
createEffect(() =>
    localStorage.setItem("endpoint", endpoint())
)

function ConfigurationInstructions() {
    return <>
        <h2 onClick={() => setShowConfig(true)}>Configuration</h2>
        <Show when={shouldShowConfig()}>
            <ul>
                <li>Stable Diffusion Dream Server: <input type={"text"} value={endpoint()}
                                                          onChange={(e) => setEndpoint(e.currentTarget.value)}/></li>
                <li onClick={() => setShowConfig(false)}><i>Click here to hide your configuration.</i></li>
            </ul>
        </Show>
    </>
}

function DiffusionApp() {
    return <>
        <a href={"https://github.com/SebastianAigner/stable-diffusion-web-extended"}><img id={"pr-request"}
                                                                                    src={"https://img.shields.io/badge/Ideas%20for%20improvements%3F-Send%20a%20PR-brightgreen"}/></a>
        <div id="search">
            <SetupInstruction/>
            <ConfigurationInstructions/>
            <h2 id="header">Stable Diffusion Dream Queue</h2>

            <form id="generate-form" method="post" action="#" onSubmit={handleSubmit}>
                <fieldset id="fieldset-search">
                    <input type="text" id="prompt" name="prompt" onChange={(e) => {
                        setPrompt(e.currentTarget.value)
                    }}/>
                    <input type="submit" id="submit" value="Enqueue"/>
                </fieldset>
                <fieldset id="fieldset-config">
                    {/*<label for="iterations">Images to generate:</label>*/}
                    {/*<input value="1" type="number" id="iterations" name="iterations" onChange={(e) => {*/}
                    {/*    setIterations(e.currentTarget.valueAsNumber)*/}
                    {/*}}/>*/}
                    <label for="steps">Steps:</label>
                    <input value={steps()} type="number" id="steps" name="steps" onChange={(e) => {
                        setSteps(e.currentTarget.valueAsNumber)
                    }}/>
                    <label for="cfgscale">Cfg Scale:</label>
                    <input value="7.5" type="number" id="cfgscale" name="cfgscale" step="any" onChange={(e) => {
                        setCfgScale(e.currentTarget.valueAsNumber)
                    }}/>
                    <span>&bull;</span>
                    <label title="Set to multiple of 64" for="width">Width:</label>
                    <select id="width" name="width" value="512" onChange={(e) => {
                        setWidth(parseInt(e.currentTarget.value))
                    }}>
                        <option value="64">64</option>
                        <option value="128">128</option>
                        <option value="192">192</option>
                        <option value="256">256</option>
                        <option value="320">320</option>
                        <option value="384">384</option>
                        <option value="448">448</option>
                        <option value="512">512</option>
                        <option value="576">576</option>
                        <option value="640">640</option>
                        <option value="704">704</option>
                        <option value="768">768</option>
                        <option value="832">832</option>
                        <option value="896">896</option>
                        <option value="960">960</option>
                        <option value="1024">1024</option>
                    </select>
                    <label title="Set to multiple of 64" for="height">Height:</label>
                    <select id="height" name="height" value="512" onChange={(e) => {
                        setHeight(parseInt(e.currentTarget.value))
                    }}>
                        <option value="64">64</option>
                        <option value="128">128</option>
                        <option value="192">192</option>
                        <option value="256">256</option>
                        <option value="320">320</option>
                        <option value="384">384</option>
                        <option value="448">448</option>
                        <option value="512">512</option>
                        <option value="576">576</option>
                        <option value="640">640</option>
                        <option value="704">704</option>
                        <option value="768">768</option>
                        <option value="832">832</option>
                        <option value="896">896</option>
                        <option value="960">960</option>
                        <option value="1024">1024</option>
                    </select>
                    <br/>
                    <label title="Upload an image to use img2img" for="initimg">Img2Img Init:</label>
                    <input type="file" id="initimg" name="initimg" accept=".jpg, .jpeg, .png" disabled={true}/>
                    <label title="Set to -1 for random seed" for="seed">Seed:</label>
                    <input value="-1" type="number" id="seed" name="seed" onChange={(e) => {
                        setSeed(e.currentTarget.valueAsNumber)
                    }}/>
                    <button type="button" id="reset">&olarr;</button>
                </fieldset>
            </form>
            <div id="about">UI based on the original embedded webserver of <a
                href="http://github.com/lstein/stable-diffusion">lstein/stable-diffusion</a> with additional
                enhancements.
            </div>
        </div>
        <hr/>
        <TaskQueue/>
        <hr/>
        <div id="results">


            <For each={images()} fallback={<div id="no-results-message"><i><p>No results...</p></i></div>}>
                {(item, index) => (
                    <div class={"gen-image"}>
                    <img src={`${endpoint()}/${item.outputs[0][0]}`}/>
                        <br/>
                        <div>
                            <p>{item.outputs[0][2]["prompt"]}</p>
                        </div>
                    </div>
                )}
            </For>
        </div>
    </>
}

const [currentTaskQueueView, setCurrentTaskQueueView] = createSignal(myTaskQueue.internalQueue)

function TaskQueue() {
    const queueUpdater =
        setInterval(() => {
            setCurrentTaskQueueView([...myTaskQueue.internalQueue]) // TODO: This should absolutely be reactive.
            console.log(myTaskQueue.internalQueue)
            console.log(currentProcessedElement())
        }, 200)
    onCleanup(() => clearInterval(queueUpdater))

    return <>
        <Show when={currentProcessedElement() != undefined}>
            <p id={"current"}>Currently working on <b>{currentProcessedElement()?.prompt}</b> ({currentProcessedElement()?.width} x {currentProcessedElement()?.height}) @ {currentProcessedElement()?.steps} steps.</p>
        </Show>

        <table>
            <For each={currentTaskQueueView()}
                 fallback={<tr><td>(When no tasks are queued, last configuration is repeated)</td></tr>}>
                {(item, index) => (
                    <tr>
                        <td>{item.value.prompt}</td>
                        <td>(</td>
                        <td>{item.value.width}</td>
                        <td>x</td>
                        <td>{item.value.height}</td>
                        <td>) @ </td>
                        <td>{item.value.steps}</td>
                        <td> steps</td>
                    </tr>
                )}
            </For>
        </table>
    </>
}


export default DiffusionApp;