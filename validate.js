 (function(window, document, undefined) {
    //提示信息
    var defaults = {
        message:{
            required: '%s不能为空.',
            number: '%s为整数'
        },
        callback: function(errors){
            
        }
    };
    var number = /^[0-9]+$/,
        compare = /^(compare)\[(>=|<=|>|<|=)(.+?)\]$/;
    
    var FormValidator = function(formNameOrNode,aka,fields,callback){
        this.form = (typeof formNameOrNode === 'object') ? formNameOrNode : document.forms[formNameOrNode];
        this.fields = {};
        this.errors = [];
        this.aka = aka||{};
        this.define = {};//自定义规则
        that = this;
        this.callback = callback||defaults.callback;
        
        for(var i=0,len=fields.length;i<len;i++){
            var field = fields[i];
            
            if(field.name && field.depend){
                var parts = compare.exec(field.depend); 
                if(parts){
                    this._addField({name:field.name,rules:field.depend}, field.name);
                    var op = {'<':'>','>':'<','>=':'<=','<=':'>=','=':'='};
                    var rule = field.depend.replace(parts[2],op.parts[2]).replace(parts[3],field.name);
                    this._addField({name:parts[3],rules:rule}, parts[3]);
                }
            }
            
            if ((!field.name && !field.names) || !field.rules) {
                    continue;
            }
            if(typeof field.rules =='string'){
                if (field.names) {
                        for (var j = 0, fieldNamesLength = field.names.length; j < fieldNamesLength; j++) {
                            this._addField(field, field.names[j]);
                        }
                    } else {
                        this._addField(field, field.name);
                }
            }else{
                if  (typeof field.rules =='object'){
                    for(var key in field.rules){
                        var func = field.rules[key];
                        if(typeof func==='function'){
                            var temp = {};
                            temp[key] = func;
                            this.define[field.name] = temp;
                            this._addField({name:field.name,rules:key}, field.name);
                        }
                    }
                }  
            }
        }
        
        
        var _onsubmit = this.form.onsubmit;

        this.form.onsubmit = (function(that) {
            console.log(that.fields);
            console.log(that.define)
            return function(evt) {
                try {
                        return that._validateForm(evt) && (_onsubmit === undefined || _onsubmit());
                } catch(e) {}
            };
        })(this);
    },
    in_array = function(arr,value){
                for(var i=0;i<arr.length;i++){
                    if(arr[i]==value)
                        return true;
                }
                return false;
    },
    attributeValue = function (element, attributeName) {
        var i;

        if ((element.length > 0) && (element[0].type === 'radio' || element[0].type === 'checkbox')) {
            for (i = 0, elementLength = element.length; i < elementLength; i++) {
                if (element[i].checked) {
                    return element[i][attributeName];
                }
            }

            return;
        }

        return element[attributeName];
    };
    
    /*************************************************************/    
    FormValidator.prototype._addField = function(field, nameValue)  {
        if(this.fields[nameValue]){
            var rules = field.rules.split('|');
            var rules_exist = this.fields[nameValue].rules;
            for(var i=0,len=rules.length;i<len;i++){
                if(in_array(rules_exist,rules[i])){
                    continue;
                }else{
                    rules_exist.push(rules[i]);
                }   
            }
            this.fields[nameValue].rules = rules_exist;
        }else{
            this.fields[nameValue] = {
                name: nameValue,
                rules: field.rules.split('|')                
            };
        }
    };
    
    FormValidator.prototype._validateForm = function(evt){
        this.errors = [];
        for (var key in this.fields) {       
                var field = this.fields[key] || {},
                    element = this.form[field.name];
                if (element && element !== undefined) {
                    field.id = attributeValue(element, 'id');
                    field.element = element;
                    field.type = (element.length > 0) ? element[0].type : element.type;
                    field.value = attributeValue(element, 'value');                
                    this._validateField(field);      
            }
        }
        if (typeof this.callback === 'function') {
            this.callback(this.errors);
        }
        if (this.errors.length > 0) {
            if (evt && evt.preventDefault) {
                evt.preventDefault();
            } else if (event) {
                // for IE 
                event.returnValue = false;
            }
        }
    }; 


    FormValidator.prototype._validateField = function(field) {
        var rules = field.rules;
        var isRequired = rules.join('').indexOf('required')==-1 ? false:true;
        for (var i = 0, ruleLength = rules.length; i < ruleLength; i++) {
            if(!(isRequired||field.value)){
                break;
            }
            var parts = compare.exec(rules[i]);
            if(parts){
                var method = parts[1],
                    param = parts[2];
                    target = this.form[parts[3]],
                    failed = false;
                if (typeof this._hooks[method] === 'function') {
                    var result = this._hooks[method](field,param,target);
                    if(!result[0]){
                        failed = true;
                        var message = result[1];
                    }
                }
            }else{
                var method = rules[i],
                failed = false;
                if (typeof this._hooks[method] === 'function') {
                    if(!this._hooks[method](field)){
                        failed = true;    
                        var message = (defaults.message[method]||(method+'规则不存在')).replace('%s',this.aka[field.name]||field.name);
                    }
                }
            }

           if (failed) {
                this.errors.push({
                    id: field.id,
                    element: field.element,
                    name: field.name,
                    rule: method,
                    message:message
                });
            }        
        }     
    };
    
    FormValidator.prototype._hooks = {
        required:function(field){
            var value = field.value; 
            return value !== null && value !== '';
        },
        number:function(field){
            return (number.test(field.value));
        },
        compare:function(field,param,target){
            if(!target.value){
                return [false,'请填写'+that.aka[target.name]||target.name];
            }else{
                var func = that.define[field.name]&&that.define[field.name].compare;
                if(func){
                    try{return [func(),(that.aka[field.name]||field.name)+'必须'+param+(that.aka[target.name]||target.name)]}
                    catch(e){return [func(),(that.aka[field.name]||field.name)+'不能'+param+(that.aka[target.name]||target.name)]}    
                }else{
                    try{return [eval(field.value+param+target.value),(that.aka[field.name]||field.name)+'必须'+param+(that.aka[target.name]||target.name)]}
                    catch(e){return [eval('"'+field.value+'"'+param+'"'+target.value+'"'),(that.aka[field.name]||field.name)+'不能'+param+(that.aka[target.name]||target.name)]}
                }
            }           
        }
    };
   
   
   window.FormValidator = FormValidator;

})(window, document);