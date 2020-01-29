class Result{
    // val:BlockResult|undefined;
    val:any
    err:any;
    constructor() {
        this.val = undefined
        this.err = undefined
    }
}

function promiseResult(promise:Promise<any>){
    return new Promise(res=>{
        const payload = new Result();
        promise.then((r)=>{
            payload.val = r
        }).catch((e)=>{
            payload.err = e
        }).then(()=>{
            res(payload)
        })
    })
}

export {Result,promiseResult}
