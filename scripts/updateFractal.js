var fragmentShaderSource = "";
var operationHierarchy = ["^","*/","+-"];

var operationToFunction = [
    ["+", "cadd"],
    ["-", "csub"],
    ["*", "cmult"],
    ["/", "cdiv"],
    ["^", "cpow"],
    ["re", "real"],
    ["im", "imaginary"],
    ["abs", "cabs"]
]

class functionHierarchy {
    a;
    b;
    operation;
    isATerm;
    constructor(formula){
        if(formula[0] == '(' && formula[formula.length-1] == ')'){
            var nestedParentheses = 1;
            var i = 0;
            while(nestedParentheses > 0){
                i++;
                if(formula[i] == '('){
                    nestedParentheses++;
                }
                if(formula[i] == ')'){
                    nestedParentheses--;
                }
            }
            if(i == formula.length-1){
                formula = formula.slice(1, formula.length-1);
            }
        }
        var lowestOperation = -1;
        var lowestOperationTier = 0;
        for(var i = 0; i < formula.length; i++){
            if(formula[i] == '('){
                var nestedParentheses = 1;
                while(nestedParentheses > 0){
                    i++;
                    if(formula[i] == '('){
                        nestedParentheses++;
                    }
                    if(formula[i] == ')'){
                        nestedParentheses--;
                    }
                }
                i--;
            }
            for(var j = lowestOperationTier; j < operationHierarchy.length; j++){
                if(operationHierarchy[j].includes(formula[i])){
                    lowestOperation = i;
                    lowestOperationTier = j+1;
                }
            }
        }
        if(lowestOperation == -1){
            if(formula[0] == 'r' && formula[1] == 'e'){
                this.operation = "re";
                this.a = new functionHierarchy(formula.slice(3, formula.length-1));
            }
            else if(formula[0] == 'i' && formula[1] == 'm'){
                this.operation = "im";
                this.a = new functionHierarchy(formula.slice(3, formula.length-1));
            }
            else if(formula[0] == 'a' && formula[1] == 'b' && formula[2] == 's'){
                this.operation = "abs";
                this.a = new functionHierarchy(formula.slice(4, formula.length-1));
            }
            else{
                this.isATerm = true;
                this.a = formula;
            }
        }
        else{
            this.isATerm = false;
            this.a = new functionHierarchy(formula.slice(0,lowestOperation));
            this.b = new functionHierarchy(formula.slice(lowestOperation+1));
            this.operation = formula[lowestOperation];
        }
    }
    genFunc() {
        var out = ""
        if(this.isATerm){
            if(this.a == "z" || this.a == "c"){
                return this.a;
            }
            else if(this.a == "i"){
                return "vec2(0,1)";
            }
            else if(this.a == "t"){
                return "vec2(time,0)";
            }
            else{
                return "vec2("+this.a+",0)";
            }
        }
        else{
            for(var i = 0; i < operationToFunction.length; i++){
                if(operationToFunction[i][0] == this.operation){
                    out += operationToFunction[i][1];
                    break;
                }
            }
            if(this.b){
                out += "(" + this.a.genFunc() + "," + this.b.genFunc() + ")";
            }
            else{
                out += "(" + this.a.genFunc() + ")";
            }
        }
        return out;
    }
}

function updateFractal(){
    timeOfLastUpdate = currentTime;
    timeOfLastPause = currentTime;
    pauseTime = 0;
    previousPauseTime = 0;
    fragmentShaderSource = fragmentShaderSourcePreedit;
    fragmentShaderSource = fragmentShaderSource.replace("{{function}}", generateFunction(document.getElementById("formulaText").value));
    fragmentShaderSource = fragmentShaderSource.replace("{{controlPoints}}", generateControlPoints(document.getElementById("colorScheme").value));
    fragmentShaderSource = fragmentShaderSource.replace("{{coloringAlgorithm}}", document.getElementById("enableOrbitTrap").checked ? orbitTrapAlgorithm : escapeTimeAlgorithm);
    fragmentShaderSource = fragmentShaderSource.replace("{{distanceAlgorithm}}", getDistanceAlgorithm(document.getElementById("orbitTrapType").value));
    iterationCount = Number(document.getElementById("iterationCount").value);
    colorPeriod = Number(document.getElementById("colorPeriod").value);
}

var distanceAlgorithmTable = [
    ["point", distancePoint],
    ["circle", distanceCircle],
    ["cross", distanceCross],
    ["fourCircles", distanceFourCircles]
]

function getDistanceAlgorithm(value){
    for(var i in distanceAlgorithmTable){
        if(distanceAlgorithmTable[i][0] == value){
            return(distanceAlgorithmTable[i][1]);
        }
    }
}

function generateFunction(formula){
    var newFormula = formula;
    //explicitize implicit multiplication
    for(var i = 0; i < newFormula.length-1; i++){
        var cur = newFormula[i];
        var next = newFormula[i+1];
        if((cur == 'z' || cur == 'c' || cur == ')' || cur == 't' || isDigit(cur)) && (next == 't' || next == 'z' || next == 'c' || next == '(' || next == 'i'))
        {
            newFormula = insert(newFormula, '*', i+1);
            i++;
        }
    }
    hierarchy = new functionHierarchy(newFormula);
    console.log(hierarchy.genFunc());
    return(hierarchy.genFunc());
}

function generateControlPoints(input){
    brokenString = input.split("#");
	rawHex = [];
	for(var i = 1; i < brokenString.length; i++){
		rawHex.push(brokenString[i].slice(0,6));
    }
	rawHexMirrored = rawHex;
	for(var i = rawHex.length-2; i > -1; i--){
		rawHexMirrored.push(rawHex[i]);
    }
	finalString = "vec4[] controlPoints = vec4["+rawHexMirrored.length+"](";
	for(var i = 0; i < rawHexMirrored.length; i++){
		finalString+="vec4("+Math.floor(10000/(rawHexMirrored.length-1)*i)+","+parseInt(rawHexMirrored[i].slice(0,2), 16)/255+","+parseInt(rawHexMirrored[i].slice(2,4), 16)/255+","+parseInt(rawHexMirrored[i].slice(4,6), 16)/255+")";
		if(i < rawHexMirrored.length-1){
		   finalString+=",";
        }
    }
	finalString+=");"
	return finalString
//    return(`vec4[] controlPoints = vec4[23](vec4(0,0.023529411764705882,0.054901960784313725,0.06666666666666667),vec4(454,0.09019607843137255,0.19215686274509805,0.21176470588235294),vec4(909,0.13333333333333333,0.34509803921568627,0.34901960784313724),vec4(1363,0.21568627450980393,0.5058823529411764,0.4588235294117647),vec4(1818,0.3568627450980392,0.6705882352941176,0.5450980392156862),vec4(2272,0.4823529411764706,0.7058823529411765,0.4823529411764706),vec4(2727,0.6313725490196078,0.7294117647058823,0.42745098039215684),vec4(3181,0.796078431372549,0.7372549019607844,0.396078431372549),vec4(3636,0.8823529411764706,0.6039215686274509,0.3568627450980392),vec4(4090,0.9098039215686274,0.4666666666666667,0.4196078431372549),vec4(4545,0.8470588235294118,0.3686274509803922,0.5411764705882353),vec4(5000,0.6666666666666666,0.34509803921568627,0.6666666666666666),vec4(5454,0.8470588235294118,0.3686274509803922,0.5411764705882353),vec4(5909,0.9098039215686274,0.4666666666666667,0.4196078431372549),vec4(6363,0.8823529411764706,0.6039215686274509,0.3568627450980392),vec4(6818,0.796078431372549,0.7372549019607844,0.396078431372549),vec4(7272,0.6313725490196078,0.7294117647058823,0.42745098039215684),vec4(7727,0.4823529411764706,0.7058823529411765,0.4823529411764706),vec4(8181,0.3568627450980392,0.6705882352941176,0.5450980392156862),vec4(8636,0.21568627450980393,0.5058823529411764,0.4588235294117647),vec4(9090,0.13333333333333333,0.34509803921568627,0.34901960784313724),vec4(9545,0.09019607843137255,0.19215686274509805,0.21176470588235294),vec4(10000,0.023529411764705882,0.054901960784313725,0.06666666666666667));`);
}

function isDigit(char){
    return (char <= '9' && char >= '0')
}

function insert(str, ins, index){
    return str.slice(0,index)+ins+str.slice(index);
}