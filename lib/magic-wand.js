/*
* License:  The MIT License (MIT) Ryasnoy Paul、todaylg
*/

MagicWand = (function () {
    var lib = {};
    var tempData = new Uint8Array;//取每次选取的并集
    var preData = new Uint8Array;//撤销

    /** Create a binary(二进制) mask on the image by color threshold
      * Algorithm: Scanline flood fill (http://en.wikipedia.org/wiki/Flood_fill)
      * @param {Object} image: {Uint8Array} data, {int} width, {int} height, {int} bytes
      * @param {int} x of start pixel
      * @param {int} y of start pixel
      * @param {int} color threshold
      * @param {Uint8Array} mask of visited points (optional) 
      * @return {Object} mask: {Uint8Array} data, {int} width, {int} height, {Object} bounds
      */

    // 过程：
    // Flood-fill (node, target-color, replacement-color):
    //  1. If target-color is equal to replacement-color, return.
    //  2. If color of node is not equal to target-color, return.
    //  3. Set Q to the empty queue.
    //  4. Add node to Q.
    //  5. For each element N of Q:
    //  6.         Set w and e equal to N.
    //  7.         Move w to the west until the color of the node to the west of w no longer matches target-color.
    //  8.         Move e to the east until the color of the node to the east of e no longer matches target-color.
    //  9.         For each node n between w and e:
    // 10.             Set the color of n to replacement-color.
    // 11.             If the color of the node to the north of n is target-color, add that node to Q.
    // 12.             If the color of the node to the south of n is target-color, add that node to Q.
    // 13. Continue looping until Q is exhausted.
    // 14. Return.

    lib.floodFill = function(image, px, py, colorThreshold, mask) {
        var c, x, newY, el, xr, xl, dy, dyl, dyr, checkY,
            data = image.data,
            w = image.width,
            h = image.height,
            bytes = image.bytes, // number of bytes in the color
            maxX = -1, minX = w + 1, maxY = -1, minY = h + 1,
            i = py * w + px, // start point index in the mask data  
            result = new Uint8Array(w * h), // result mask
            visited = new Uint8Array(mask ? mask : w * h); // mask of visited points
        if (visited[i] === 1) return null;

        i = i * bytes; // start point index in the image data
        var sampleColor = [data[i], data[i + 1], data[i + 2], data[i + 3]]; // start point color (sample)
        var stack = [{ y: py, left: px - 1, right: px + 1, dir: 1 }]; // first scanning line
        do {
            el = stack.shift(); // get line for scanning

            checkY = false;
            for (x = el.left + 1; x < el.right; x++) {
                dy = el.y * w;
                i = (dy + x) * bytes; // point index in the image data
                if (visited[dy + x] === 1) continue; // check whether the point has been visited  
                // compare the color of the sample
                c = data[i] - sampleColor[0]; // check by red
                if (c > colorThreshold || c < -colorThreshold) continue;//容差
                c = data[i + 1] - sampleColor[1]; // check by green
                if (c > colorThreshold || c < -colorThreshold) continue;
                c = data[i + 2] - sampleColor[2]; // check by blue
                if (c > colorThreshold || c < -colorThreshold) continue;

                checkY = true; // if the color of the new point(x,y) is similar to the sample color need to check minmax for Y 

                result[dy + x] = 1; // mark a new point in mask
                visited[dy + x] = 1; // mark a new point as visited

                xl = x - 1;//向左偏移一个像素
                // walk to left side starting with the left neighbor
                while (xl > -1) {//直到走完一行的全部像素
                    dyl = dy + xl;
                    i = dyl * bytes; // point index in the image data
                    if (visited[dyl] === 1) break; // check whether the point has been visited
                    // compare the color of the sample
                    c = data[i] - sampleColor[0]; // check by red
                    if (c > colorThreshold || c < -colorThreshold) break;
                    c = data[i + 1] - sampleColor[1]; // check by green
                    if (c > colorThreshold || c < -colorThreshold) break;
                    c = data[i + 2] - sampleColor[2]; // check by blue
                    if (c > colorThreshold || c < -colorThreshold) break;
                    //一旦有一个像素颜色不匹配，就直接break
                    result[dyl] = 1;
                    visited[dyl] = 1;
                    xl--;
                }
                xr = x + 1;//向右偏移一个像素
                // walk to right side starting with the right neighbor
                while (xr < w) {//直到走完一行的全部像素
                    dyr = dy + xr;
                    i = dyr * bytes; // index point in the image data
                    if (visited[dyr] === 1) break; // check whether the point has been visited
                    // compare the color of the sample
                    c = data[i] - sampleColor[0]; // check by red
                    if (c > colorThreshold || c < -colorThreshold) break;
                    c = data[i + 1] - sampleColor[1]; // check by green
                    if (c > colorThreshold || c < -colorThreshold) break;
                    c = data[i + 2] - sampleColor[2]; // check by blue
                    if (c > colorThreshold || c < -colorThreshold) break;

                    result[dyr] = 1;
                    visited[dyr] = 1;
                    xr++;
                }
                // check minmax for X
                if (xl < minX) minX = xl + 1;
                if (xr > maxX) maxX = xr - 1;

                newY = el.y - el.dir;//el.y仍然是点击时y轴的位置信息，没有变
               
                if (newY >= 0 && newY < h) { // add two scanning lines in the opposite direction (y - dir) if necessary  //其实就是一行
                    if (xl < el.left) stack.push({ y: newY, left: xl, right: el.left, dir: -el.dir }); // from "new left" to "current left" //0=>left
                    if (el.right < xr) stack.push({ y: newY, left: el.right, right: xr, dir: -el.dir }); // from "current right" to "new right" //right=>width
                }
                newY = el.y + el.dir;//实现north和south！！！（+1/ -1）
                if (newY >= 0 && newY < h) { // add the scanning line in the direction (y + dir) if necessary
                    if (xl < xr) stack.push({ y: newY, left: xl, right: xr, dir: el.dir }); // from "new left" to "new right"
                }
            }
            // check minmax for Y if necessary
            if (checkY) {
                if (el.y < minY) minY = el.y;
                if (el.y > maxY) maxY = el.y;
            }
        } while (stack.length > 0); 

        //为了实现选取叠加而添加的代码部分
        if(tempData.length==0){
            tempData = result;
        }else{
            preData = new Uint8Array(tempData);//保存上一步
            for(var i=0;i<tempData.length;i++){//区域累加
                if(result[i]==1 && tempData[i]!=1){
                    tempData[i]=1;
                }
            }
        }
        return {
            data: tempData,
            predata: preData,
            width: image.width,
            height: image.height,
            bounds: {
                minX: minX,
                minY: minY,
                maxX: maxX,
                maxY: maxY
            }
        };
    };

    /** Create a border index array of boundary points of the mask
      * @param {Object} mask: {Uint8Array} data, {int} width, {int} height
      * @return {Array} border index array boundary points of the mask
      */
     
    lib.getBorderIndices = function(mask) {
        tempData = mask.data;//确保tempData永远都是当前选取的数据
        var x, y, k, k1, k2,
            w = mask.width,
            h = mask.height,
            data = mask.data,
            border = [], // only border points
            x1 = w - 1,
            y1 = h - 1;

        // walk through inner values except points on the boundary of the image
        for (y = 1; y < y1; y++)
            for (x = 1; x < x1; x++) {
                k = y * w + x;
                if (data[k] === 0) continue; // "white" point isn't the border
                k1 = k + w; // y + 1
                k2 = k - w; // y - 1
                // check if any neighbor with a "white" color
                if (data[k + 1] === 0 || data[k - 1] === 0 ||
                    data[k1] === 0 || data[k1 + 1] === 0 || data[k1 - 1] === 0 ||
                    data[k2] === 0 || data[k2 + 1] === 0 || data[k2 - 1] === 0) {
                    border.push(k);
                }
            }

        // walk through points on the boundary of the image if necessary
        // if the "black" point is adjacent to the boundary of the image, it is a border point
        for (y = 0; y < h; y++)
            if (data[y * w] === 1)
                border.push(y * w);

        for (x = 0; x < w; x++)
            if (data[x] === 1)
                border.push(x);

        k = w - 1;
        for (y = 0; y < h; y++)
            if (data[y * w + k] === 1)
                border.push(y * w + k);

        k = (h - 1) * w;
        for (x = 0; x < w; x++)
            if (data[k + x] === 1)
                border.push(k + x);

        return border;
    };

    lib.getCurrentResult = function(mask) {
        if(!mask) return;
        tempData = mask.data;//确保tempData永远都是当前的选取及填充数据
        var x, y, k, k1, k2,
            w = mask.width,
            h = mask.height,
            data = mask.data,
            res = [], // only res points
            x1 = w - 1,
            y1 = h - 1;

        // walk through inner values except points on the boundary of the image
        for (y = 1; y < y1; y++)
            for (x = 1; x < x1; x++) {
                k = y * w + x;
                if (data[k] === 0) continue; // "white" point isn't the border
                res.push(k);
            }

        return res;
    };
    lib.clearPreData = function(){
        preData = new Uint8Array;
        tempData = new Uint8Array;
    }
    return lib;
})();
