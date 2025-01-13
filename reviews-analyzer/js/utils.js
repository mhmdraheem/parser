function dateParser(date) {
const dateArr = date.replace("قبل", '').trim().split(" ");

let unit, number;
if(dateArr.length === 2) {
    number = +convertToEnglish(dateArr[0]);
    unit = dateArr[1];
} else {
    unit = dateArr[0];
}

const mappings = {
    "ساعة": { unit: "hour", value: 1 },
    "ساعتين":{ unit: "hour", value: 2 },
    "ساعات": { unit: "hour", value: number },

    "يوم": { unit: "day", value: 1 },
    "يومين":{ unit: "day", value: 2 },
    "أيام": { unit: "day", value: number },

    "أسبوع": { unit: "week", value: 1 },
    "أسبوعين": { unit: "week", value: 2 },
    "أسابيع": { unit: "week", value: number },
    
    "شهر": { unit: "month", value: 1 },
    "شهرين": { unit: "month", value: 2 },
    "أشهر": { unit: "month", value: number },
    "شهرًا": { unit: "month", value: number },
    
    "سنة": { unit: "year", value: 1 },
    "سنتين": { unit: "year", value: 2 },
    "سنوات": { unit: "year", value: number },
}

return mappings[unit];
}

function convertToEnglish(text) {
return text
    .split("")
    .map((char) => {
    const charCode = char.charCodeAt(0);
    if (charCode >= 1632 && charCode <= 1641) {
        // Convert Arabic numeral to English numeral
        return String.fromCharCode(charCode - 1584);
    }
    return char; // Leave non-Arabic characters unchanged
    })
    .join("");
}