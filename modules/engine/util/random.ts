
 
 /** Gets n random items from array */
  export function getRandomN<T> 
  (
      /** array to get random items from */
      array:T[],
      /** number of items to get from array */
      n = 1,
      /** whether to remove from array */
      remove = false
  ) 
  {
    if (!array?.length || array.length <= 0) return [];
    if (n > array.length) return array;

    const result = new Array(n);

    // if removing, just loop and getting getting a new random item
    if (remove) {
        while(n--) {
            const x = Math.floor(Math.random() * array.length);
            result[n] = array[x];
        }
    }
    // if not removing, use special algorithm to prevent getting same thing twice
    else {
        let len = array.length;
        const taken : Array<number> = new Array(len);
        while (n--) {
            const x = Math.floor(Math.random() * len);
            result[n] = array[x in taken ? taken[x] : x];
            taken[x] = --len in taken ? taken[len] : len;
        }
    }


    return result;
 } 

/** Gets random item from array */
export function getRandom<T> (array:T[]) {
    return array?.length ? array[Math.floor(Math.random() * array.length)] : null;
}

/** returns a randomly distributed array of numbers that add up to {total} with length = {count} */
export function distribute(total:number, count:number, ) {
    const r: number[] = [];
    const decimals = [];
    let currsum = 0;
    for(var i = 0; i < count; i++) {
        r.push(Math.random());
        currsum += r[i];
    }

    var remaining = total;
    for(var i=0; i<r.length; i++) {
        var res = r[i] / currsum * total;
        r[i] = Math.floor(res);
        remaining -= r[i];
        decimals.push(res - r[i]);
    }

    while(remaining > 0){
        let maxPos = 0;
        let maxVal = 0;

        for(let i=0; i<decimals.length; i++){
            if(maxVal < decimals[i]){
                maxVal = decimals[i];
                maxPos = i;
            }
        }

        r[maxPos]++;
        decimals[maxPos] = 0; // We set it to 0 so we don't give this position another one.
        remaining--;
    }

    return r;
}


export interface ProbableItem {
    /** percentage (0-100%) probability of being picked */
    probability:number;
    item:any;
}


/** returns items with specified probabilities (NOTE: probabilities should add up to 100) */
export function randoProb(items:ProbableItem[]) {
    if (!items?.length) return null;

    // order by probability
    items.sort((a,b) => a.probability > b.probability ? 1 : -1);

    const r = Math.floor(Math.random() * 101);
    let prob = 0;
    for (let i = 0; i < items.length - 1; i++) {
        let p = items[i];
        prob += p.probability;
        if (r < prob) {
            return p.item;
        }
    }
    
    return items[items.length-1].item;
}
