export { loadAll }

/**
 * 
 * @param {Object<string,string>} map maps image name to url src 
 * @param {function(Object<string,HTMLImageElement>):void} callback
 */
function loadAll(map, callback) {
    
    const promises = [];
    /** @type {Object<string, HTMLImageElement>} */
    const output = {};

    for (let key in map) {
        const src = map[key];
        promises.push(
            load(src).then(img => {
                console.log("LOADED: " + key);
                output[key] = img;
            })
        )
    }

    Promise
        .all(promises)
        .then(() => callback(output));
}

/**
 * 
 * @param {string} src 
 * @returns Promise<Image>
 */
function load(src) {
    return new Promise((resolve, _) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
        console.log(img.src);

    }); 
}