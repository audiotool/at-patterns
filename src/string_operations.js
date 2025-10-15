export function palindrome(string, sep) {
    var arr = string.split(sep);
    const numElem = arr.length;

    var i;
    
    for(i = numElem - 1; i >= 0; i--) {
	arr.push(arr[i])
    }

    return arr.join(sep)
}

export function reverse(string, sep) {
    var arr = string.split(sep);
    const numElem = arr.length;
    
    var rev = [];

    var i;
    
    for(i = 0; i < numElem; i++) {
	var elem = arr.pop();
	rev.push(elem);	    
    }

    return rev.join(sep)
}

export function lshift(string, sep, n) {
    var arr = string.split(sep);
    
    var i;
    
    for(i = 0; i < n; i++) {
	var elem = arr.shift();
	arr.push(elem);	    
    }

    return arr.join(sep)
}

export function rshift(string, sep, n) {
    var arr = string.split(sep);
    
    var i;
    
    for(i = 0; i < n; i++) {
	var elem = arr.pop();
	arr.unshift(elem);	    
    }

    return arr.join(sep)
}
