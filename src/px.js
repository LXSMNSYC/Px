/**
 * @license MIT
 * MIT License
 * 
 * Copyright (c) 2019 Alexis Munsayac
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 * 
 * @author Alexis Munsayac <alexis.munsayac@gmail.com>
 * @copyright Alexis Munsayac 2019
 */
/**
 * Executor callback for Promises
 * @callback PromiseExecutor
 * @param {Function=} resolve Resolves the Promise with the given value.
 * @param {Function=} reject Rejects the Promise with the given value.
 */
/**
 * a callback for resolved values.
 * @callback OnResolve
 * @param {*} x the resolved Promise value
 */
/**
 * a callback for rejected values.
 * @callback OnReject
 * @param {*} x the rejected Promise value
 */
/**
 * a callback that is executed on fulfillment.
 * @callback onFinally
 * @returns {*}
 */
/**
 * a callback for testing the amount of retries and 
 * the rejection value of the retried DeferredPromise.
 * @callback RetryTester
 * @param {Number} tries the amount of current retries for the DeferredPromise
 * @param {*} value the rejection value
 * @returns {Boolean}
 */
/**
 * a callback that compares the fulfilled value of the Promise against the given value
 * @callback ContainsTester
 * @param {*} fulfilledValue the fulfilled value of the Promise
 * @param {*} sampleValue the sample value expected from the Promise
 * @returns {Boolean}
 */
/**
 * a callback that compares the fulfilled values of the two Promises.
 * @callback CompareTester
 * @param {*} valueA the fulfilled value of the first Promise
 * @param {*} valueB the fulfilled value of the second Promise
 * @returns {Boolean}
 */
/**
 * @class
 * @clasdesc
 * DeferredPromise is a Promise that doesn't execute the supplied function to its constructor.
 * DeferredPromise executes the function whenever a then, catch, or finally is called upon it.
 * 
 * @param {PromiseExecutor} executor a function that is passed to a Promise constructor.
 */
export class DeferredPromise{
    constructor(fn){
        this._supplier = fn;
    }
    /**
     * @description
     * Creates a DeferredPromise which resolves the given value.
     * @example 
     * DeferredPromise.resolve("Hello World").then(console.log);
     * @param {*} value 
     * @returns {DeferredPromise}
     */
    static resolve(value){
        return new DeferredPromise(res => res(value));
    }
    /**
     * @description
     * Creates a DeferredPromise which rejects the given value.
     * @example 
     * DeferredPromise.reject("Hello World").catch(console.log);
     * @param {*} value 
     * @returns {DeferredPromise}
     */
    static reject(value){
        return new DeferredPromise((res, rej) => rej(value));
    }
    /**
     * @description
     * Converts a function into an executor function. 
     * Returned values are interpreted as a resolved value, while
     * thrown errors are interpreted as a rejected value.
     * @example
     * let promise = Promise.fromCallableDeferred(() => "hello world");
     * @param {VanillaExecutor} executor
     * @returns {Promise}
     */
    static fromCallable (executor){
        let result;
        try{
            result = executor();
        } catch (e){
            return DeferredPromise.reject(e);
        }
        return DeferredPromise.resolve(result);
    }
    /**
     * Attaches callbacks to the PublishedPromise
     * @param {OnResolve} res - onResolve function
     * @param {OnReject=} rej - onReject function
     * @returns {Promise} 
     */
    then(res, rej){
        return new Promise(this._supplier).then(res, rej);
    }
    /**
     * Catches the rejection value of the PublishedPromise
     * 
     * @param {OnReject} rej - onReject function
     * @returns {Promise}
     */
    catch(rej){
        return new Promise(this._supplier).catch(rej);
    }
    /**
     * Finalize the DeferredPromise
     * @example
     * DeferredPromise.resolve(50).finally(() => console.log("Finally"));
     * DeferredPromise.reject(50).finally(() => console.log("Finally"));
     * @param {onFinally} fin
     * @returns {Promise}
     */
    finally(fin){
        return new Promise(this._supplier).finally(fin);
    }
    /**
     * @description
     * Retries a rejected DeferredPromise multiple times until a resolved value is fulfilled.
     * 
     * If a function is provided, Retries until the function returns false, in which
     * will return a rejected Promise with the propagated error.
     *
     * @example
     * Promise.reject(50).defer().retry();
     * 
     * @param {RetryTester=} fn  - a function that returns a boolean
     * @returns {Promise}
     */
    retry(fn){
        let supplier = this._supplier;
        if(typeof fn === 'function'){
            let tries = 0;
            let resub = () => new Promise(supplier).then(
                x => x,
                x => fn(++tries, x) ? resub() : Promise.reject(x)
            );
    
            return resub();
        }
        let resub = () => new Promise(supplier).then(
            x => x,
            () => resub()
        );
        return resub();
    }
    /**
     * @description
     * Delays the DeferredPromise by a significant amount of time 
     * before running the executor.
     * 
     * @example
     * Promise.resolve(50).defer().delay(5000);
     * 
     * @param {Number} amount - the delay in milliseconds
     */
    delay(amount){
        return new DeferredPromise((res,rej) => {
            setTimeout(() => {
                this._supplier(res, rej);
            }, amount);
        });
    }
    /**
     * @description
     * Creates a Promise version of a DeferredPromise
     * 
     * @returns {Promise}
     */
    toPromise(){
        return new Promise(this._supplier);
    }
}

/**
 * @class
 * @classdesc
 * PublishedPromise is a Promise that you can resolve/reject asynchronously.
 * 
 * @param {PromiseExecutor} executor a function that is passed to a Promise constructor.
 */
export class PublishedPromise{
    constructor(fn){
        this._promise = new Promise((res, rej) => {
            this._resolve = res;
            this._reject = rej;

            if(typeof fn === 'function'){
                fn(res, rej);
            }
        });
    }
    /**
     * Resolves the PublishedPromise
     * @example
     * let publish = new PublishedPromise();
     * publish.then(console.log);
     * publish.resolve("Hello World");
     * @param {*} value 
     */
    resolve(value){
        this._resolve(value);
    }
    /**
     * Rejects the PublishedPromise
     * @example
     * let publish = new PublishedPromise();
     * publish.catch(console.log);
     * publish.reject("Hello World");
     * @param {*} value 
     */
    reject(value){
        this._reject(value);
    }
    /**
     * Attaches callbacks to the PublishedPromise
     * @param {OnResolve} res - onResolve function
     * @param {OnReject=} rej - onReject function
     * @returns {Promise} 
     */
    then(res, rej){
        return this._promise.then(res, rej);
    }
    /**
     * Catches the rejection value of the PublishedPromise
     * 
     * @param {OnReject} rej - onReject function
     * @returns {Promise}
     */
    catch(rej){
        return this._promise.catch(rej);
    }
    /**
     * Finalize the PublishedPromise
     * @example
     * let publish = new PublishedPromise();
     * publish.finally(() => console.log("Finally"));
     * publish.resolve("Hello World");
     * @param {onFinally} fin
     * @returns {Promise}
     */
    finally(fin){
        return this._promise.finally(fin);
    }
    /**
     * @description
     * Creates a Promise version of a PublishedPromise
     * 
     * @returns {Promise}
     */
    toPromise(){
        return this._promise;
    }
}
/**
 * The Promise object represents the eventual completion (or failure) 
 * of an asynchronous operation, and its resulting value.
 * @external Promise
 * @see {@link https://promisesaplus.com/}
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise}
 */
/**
 * @function external:Promise#contains 
 * @description
 * Tests the resolved value of a Promise and a given value with a given function
 * and resolves to the function's result.
 * 
 * If the function is not provided, `contains` will perform an equality comparison.
 * @example
 * Promise.resolve(50).contains(50);
 * Promise.resolve(50).contains(50, (a, b) => a % b == 0);
 * 
 * @param {*} value - the value to be compared with the Promise' resolved value
 * @param {ContainsTester=} bipredicate 
 * a function that compares both the resolved value and the given value.
 * @returns {Promise}
 */
Promise.prototype.contains = function (value, bipredicate){
    'use strict';
    if(typeof bipredicate === 'function'){
        return this.then(x => bipredicate(x, value));
    }
    return this.then(x => x === value);
};
/**
 * @function external:Promise#delay 
 * @description
 * Delays the fulfillment of a Promise.
 * 
 * @example
 * Promise.resolve(50).delay(5000);
 * 
 * @param {Number} amount - The amount of time in milliseconds
 * @returns {Promise}
 */
Promise.prototype.delay = function (amount){
    'use strict';
    return this.then(
        x => new Promise((res) => {
            setTimeout(res, amount, x);
        }),
        x => new Promise((res, rej) => {
            setTimeout(rej, amount, x);
        })
    );
};
/**
 * @function external:Promise.compare 
 * @description
 * Compares the resolved values of the two Promises.
 * 
 * @example
 * let a = Promise.resolve(50);
 * let b = Promise.resolve(25);
 * 
 * Promise.compare(a, b, (x, y) => x%y == 0);
 * 
 * @param {!Promise} a - The Promise to be compared with
 * @param {!Promise} b - The Promise to be compared with
 * @param {!CompareTester} comparator 
 * A function that compares the resolved values of the two Promises
 * @returns {Promise}
 */
Promise.compare = function (a, b, comparator){
    'use strict';
    return Promise.all([a, b]).then(x => comparator(x[0], x[1]));
};
/**
 * @function external:Promise.equals 
 * @description
 * Compares the resolved values of the two Promises by equality.
 * 
 * @example
 * let a = Promise.resolve(50);
 * let b = Promise.resolve(25);
 * 
 * Promise.equals(a, b);
 * 
 * @param {!Promise} a - The Promise to be compared with
 * @param {!Promise} b - The Promise to be compared with
 * @returns {Promise}
 */
Promise.equals = function (a, b){
    'use strict';
    return Promise.compare(a, b, (x, y) => x === y);
};
/**
 * @function external:Promise.deferred
 * @description
 * Creates a DeferredPromise
 * @example
 * Promise.deferred(res => res("Hello World"));
 * 
 * @param {PromiseExecutor} fn - the executor function for the DeferredPromise 
 * @return {DeferredPromise}
 */
Promise.deferred = function (fn){
    'use strict';
    return new DeferredPromise(fn);
};
/**
 * @function external:Promise#defer
 * @description
 * Transforms the fulfillment value into a DeferredPromise that fulfills the value.
 * @example
 * Promise.resolve(50).defer().delay(5000);
 * @return {Promise}
 */
Promise.prototype.defer = function (){
    'use strict';
    return this.then(
        x => DeferredPromise.resolve(x),
        x => DeferredPromise.reject(x)
    );
};
/**
 * @function external:Promise.publish
 * @description
 * Creates a PublishedPromise which allows asynchronous fulfillment.
 * @example
 * let promise = Promise.publish();
 * promise.then(x => {
 *     console.log("Resolved: "..x)
 * })
 * promise.resolve(50);
 * @param {PromiseExecutor} fn - the executor function for the PublishedPromise
 * @return {PublishedPromise}
 */
Promise.publish = function (fn){
    'use strict';
    return new PublishedPromise(fn);
};
/**
 * @function external:Promise.timer
 * @description
 * Creates a Promise that resolves after a significant amount of time
 * @example
 * await Promise.timer(5000);
 * @param {Number} amount - the time in milliseconds.
 * @returns {Promise}
 */
Promise.timer = function (amount){
    'use strict';
    return new Promise(res => {
        setTimeout(res, amount, 0);
    });
};
/**
 * @function external:Promise#timeout
 * @description
 * Rejects if the given Promise didn't fulfill within a given timeout. 
 * Otherwise, it resolves with the given Promise.
 * @example
 * Promise.timer(5000).timeout(2500);
 * @param {Number} amount - the time in milliseconds.
 * @returns {Promise}
 */
Promise.prototype.timeout = function (amount){
    'use strict';
    let success = false;
    this.then(() => {success = true;});
    return new Promise((res, rej) => {
        setTimeout(() => {
            if(success){
                res(this);
            } else {
                rej(new Error('Promise TimeoutException'));
            }
        }, amount);
    });
};

/**
 * Polyfill for finally method
 * @example
 * Promise.resolve("Hello World").then(console.log);
 * Promise.reject("Hello World").catch(console.log);
 * @param {onFinally} onFinally
 * @returns {Promise}
 */
Promise.prototype.finally = function(onFinally) {
    'use strict';
    return this.then(
        /* onFulfilled */
        res => Promise.resolve(onFinally()).then(() => res),
        /* onRejected */
        err => Promise.resolve(onFinally()).then(() => { throw err; })
    );
};

/**
 * a callback that is converted into a {@link PromiseExecutor}. 
 * 
 * @callback VanillaExecutor
 * @params {Function} executor
 */

 /**
  * @function external:Promise.fromCallable
  * @description
  * Converts a function into an executor function. 
  * Returned values are interpreted as a resolved value, while
  * thrown errors are interpreted as a rejected value.
  * @example
  * let promise = Promise.fromCallable(() => "hello world");
  * @param {VanillaExecutor} executor
  * @returns {Promise}
  */
Promise.fromCallable = function (executor){
    'use strict';
    let result;
    try{
        result = executor();
    } catch (e){
        return Promise.reject(e);
    }
    return Promise.resolve(result);
};


 /**
  * @function external:Promise.fromCallableDeferred
  * @description
  * Converts a function into an executor function. 
  * Returned values are interpreted as a resolved value, while
  * thrown errors are interpreted as a rejected value.
  * 
  * This is a deferred version of {@link Promise.fromCallable}
  * @example
  * let promise = Promise.fromCallableDeferred(() => "hello world");
  * @param {VanillaExecutor} executor
  * @returns {Promise}
  */
Promise.fromCallableDeferred = function (executor){
    'use strict';
    return DeferredPromise.fromCallable(executor);
};

/**
 * @function external:Promise.delayedResolve
 * @description
 * Resolves the promise after a significant amount of time.
 * 
 * @example
 * Promise.delayedResolve("Expired after 100ms", 100);
 * 
 * @param {*} value the value to be resolved.
 * @param {Number} amount the amount of time in milliseconds
 * @returns {Promise}
 */
Promise.delayedResolve = function (value, amount){
    'use strict';
    return new Promise(res => {
        setTimeout(res, amount, value);
    });
};

/**
 * @function external:Promise.delayedReject
 * @description
 * Rejects the promise after a significant amount of time.
 * 
 * @example
 * Promise.delayedReject("Expired after 100ms", 100);
 * 
 * @param {*} value the value to be rejected.
 * @param {Number} amount the amount of time in milliseconds
 * @returns {Promise}
 */
Promise.delayedReject = function (value, amount){
    'use strict';
    return new Promise((res, rej) => {
        setTimeout(rej, amount, value);
    });
};

/**
 * A tester function that is to be passed to {@link Promise#test}
 * 
 * @callback PromiseTester
 * @param {*} value - the fulfilled value of the given Promise
 * @param {boolean} isResolved 
 * a boolean that checks whether the given value was a resolved value or not.
 * @returns {boolean} 
 */

/**
 * @function external:Promise#test
 * @description
 * Tests the resolve/reject of the given Promise through a callback function.
 * If the result is true, the value is passed to a new resolved Promise.
 * If the result is false, the value is passed to a new rejected Promise.
 * 
 * @example 
 * Promise.resolve(50).test(x => x == 50).then(x => {
 *     console.log("Resolved 50");
 * })
 * 
 * @param {PromiseTester} tester a tester callback
 */
Promise.prototype.test = function (tester){
    'use strict';
    if(typeof tester === 'function'){
        return this.then(
            x => new Promise((res, rej) => tester(x, true) ? res(x) : rej(x)),
            x => new Promise((res, rej) => tester(x, false) ? res(x) : rej(x))
        );
    }
    return this;
};