Object.prototype.reference = function(reference = "") {
    const keys = typeof reference === "string" ? reference.split(".") : reference;
    let target = this;
  
    for (const key of keys) {
      target = target[key];
    }
  
    return target;
  };