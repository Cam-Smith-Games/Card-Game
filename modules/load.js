
/**
 * 
 * @param {Object<string,string>} urls maps image name to file url 
 * @param {function(Map<string,HTMLImageElement>):void} callback
 */
export function loadImages(urls, callback) {
    const promises = 
        Object.keys(urls)
        .map(name => new Promise(resolve => {
            let img = new Image();
            img.onload = () => resolve([name, img]);
            img.onprogress = img.onloadstart = function(e) {
                console.log("progress:" , e);
            }
            img.src = urls[name];
        }));

    Promise.all(promises).then(tuples => callback(new Map(tuples)));
}


/**
 * @param {string} url 
 * @param {function(ProgressEvent<EventTarget>):void} progress
 * @returns {Promise<HTMLImageElement>}
 */
export function loadImage(url, progress){
    return new Promise(resolve => {

        let img = new Image();
        let request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'arraybuffer';
        request.onprogress = progress;
        request.onloadstart = progress;
        request.onload = function() {
            img.src = window.URL.createObjectURL(
                new Blob([this.response])
            );
            resolve(img);
        };
        request.send();
    });
 
};

/**
 * This method loads all images specified by (name->url) map
 * It tracks load progress of all images simultaneously and returns the result via callback once all have been loaded
 * @param {Object<string,string>} urls maps image name to file url 
 * @param {function(Object<string,HTMLImageElement>):void} callback function to call once complete, can also use the promise instead
 * @returns {Promise<Object<string,HTMLImageElement>>}
 * @todo loading sounds/videos (urls will need a type property, or parse extension but thats extra)
*/
export function load(urls, callback) {

    const keys = Object.keys(urls);
    const progress = new Map(keys.map(key => [key,  { loaded: 0, total: 0 }]));
    const $progress = 
        $("<div id='load'><progress></progress></div>")
        .appendTo("body")
        .find("progress");

    console.log(progress);

    function update() {
        let agg = { loaded: 0, total: 0 };
        for (let val of progress.values()) {
            agg.loaded += val.loaded;
            agg.total += val.total;
        }
        $progress.attr({
            "value": agg.loaded,
            "max": agg.total
        });    
    }

    /** @type {Object<string,HTMLImageElement>} */
    const result = {};

    const promises = keys.map(name => {
        const prog = progress.get(name);
        return loadImage(urls[name], function(e) {
            prog.loaded = e.loaded;
            prog.total = e.total;
            update();
        })
        .then(img => {
            result[name] = img;
        });
    });

    return Promise.all(promises).then(() => {
        $progress.parent().remove();
        // note: callback gets called before promise resolves
        //       this shouldn't be an issue as it's kind of an either/or whichever gets used
        //       shouldnt ever need a promise and a callback, callback is just shorter syntax
        callback(result);
        return result;
    });
}