const replaceStr = (str, char, replacer) => {
    const regex = new RegExp(char, "g")
    const replaced = str.replace(regex, replacer)
    return replaced
}

module.exports = { replaceStr }
