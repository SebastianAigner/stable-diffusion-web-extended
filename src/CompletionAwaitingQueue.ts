export interface QueueJob<T, R> {
    value: T,
    onDone: ((result: R) => void) | undefined
    onError: ((e: any) => void) | undefined
}

export class CompletionAwaitingQueue<T, R> {
    internalQueue: Array<QueueJob<T, R>> = []
    private isBusy = false

    processElement: (element: T) => Promise<R> // todo: maybe each individual job could / should provide this?
    onEmpty: () => Array<QueueJob<T, R>>
    onProcessNewElement: (element: T) => void

    constructor(processElement: (element: T) => Promise<R>, onEmpty: () => Array<QueueJob<T, R>>, onProcessNewElement: (element: T) => void) {
        this.processElement = processElement
        this.onEmpty = onEmpty
        this.onProcessNewElement = onProcessNewElement
    }

    enqueue(...item: QueueJob<T, R>[]) {
        this.internalQueue.push(...item)
        this.process() // ignore promise return value
    }

    async process() {
        if (this.isBusy) return
        if (this.internalQueue.length == 0) {
            const filler = this.onEmpty()
            if (filler.length == 0) return
            this.enqueue(...filler)
            return
        }
        this.isBusy = true


        const elem = this.internalQueue.shift()!!
        this.onProcessNewElement(elem.value)

        let res
        let err
        try {
            res = await this.processElement(elem.value)
        } catch (e: any) {
            err = e
        }

        this.isBusy = false

        this.process() // Promises are eager -- we explicitly don't await the result here, but finish our execution
        if (res != null) {
            elem.onDone?.(res)
        }
        if (err != null) {
            elem.onError?.(err)
        }
    }
}
