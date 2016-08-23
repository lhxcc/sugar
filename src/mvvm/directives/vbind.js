import Parser, { linkParser } from '../parser';
import { setAttr, addClass, removeClass } from '../../dom';
import { each, isString, isArray, isObject, diff, warn } from '../../util';

/**
 * 处理 styleObject, 批量更新元素 style
 * @param   {Element}  element
 * @param   {String}   styleObject
 */
function updateStyle (element, styleObject) {
	var style = element.style;

	if (!isObject(styleObject)) {
		return warn('v-bind for style must be a type of Object', styleObject);
	}

	each(styleObject, function (value, property) {
		if (style[property] !== value) {
			style[property] = value;
		}
	});
}

/**
 * 支持空格分割的 add/remove class
 * @param   {Element}  element
 * @param   {String}   className
 * @param   {Boolean}  remove
 */
function handleClass (element, className, remove) {
	each(className.split(' '), function (cls) {
		if (remove) {
			removeClass(element, cls);
		} else {
			addClass(element, cls);
		}
	});
}

/**
 * 根据绑定值更新元素的 className
 * @param   {Element}  element
 * @param   {Mix}      classValue
 * @param   {Boolean}  remove
 */
function updateClass (element, classValue, remove) {
	if (isString(classValue)) {
		handleClass(element, classValue, remove);
	} else if (isArray(classValue)) {
		each(classValue, function (cls) {
			handleClass(element, cls, remove);
		});
	} else if (isObject(classValue)) {
		each(classValue, function (add, cls) {
			handleClass(element, cls, remove || !add);
		});
	}
}


/**
 * v-bind 指令解析模块
 */
export function VBind () {
	Parser.apply(this, arguments);
}

var vbind = linkParser(VBind);

/**
 * 解析 v-bind 指令
 */
vbind.parse = function () {
	this.desc.deep = true;
	this.bind();
}

/**
 * 视图更新
 * @param   {Mix}  newValue
 * @param   {Mix}  oldValue
 */
vbind.update = function (newValue, oldValue) {
	var type = this.desc.args;
	if (type) {
		this.single(type, newValue, oldValue);
	} else {
		this.multi(newValue, oldValue);
	}
}

/**
 * 解析单个 attribute
 * @param   {String}  type
 * @param   {Mix}     newValue
 * @param   {Mix}     oldValue
 */
vbind.single = function (type, newValue, oldValue) {
	switch (type) {
		case 'class':
			this.handleClass(newValue, oldValue);
			break;
		case 'style':
			this.handleStyle(newValue, oldValue);
			break;
		default:
			this.handleAttr(type, newValue, oldValue);
	}
}

/**
 * 解析 attribute, class, style 组合
 * @param   {Object}  newJson
 * @param   {Object}  oldJson
 */
vbind.multi = function (newJson, oldJson) {
	if (oldJson) {
		let { after, before } = diff(newJson, oldJson);
		this.batch(after, before);
	}

	this.batch(newJson);
}

/**
 * 绑定属性批处理
 * @param   {Object}  newObj
 * @param   {Object}  oldObj
 */
vbind.batch = function (newObj, oldObj) {
	each(newObj, function (value, key) {
		this.single(key, value, oldObj && oldObj[key]);
	}, this);
}

/**
 * 更新处理 className
 * @param   {Mix}  newClass
 * @param   {Mix}  oldClass
 */
vbind.handleClass = function (newClass, oldClass) {
	var el = this.el;

	// 数据更新
	if (oldClass) {
		let { after, before } = diff(newClass, oldClass);
		updateClass(el, before, true);
		updateClass(el, after);
	} else {
		updateClass(el, newClass);
	}
}

/**
 * 更新处理 style
 * @param   {Mix}  newStyle
 * @param   {Mix}  oldStyle
 */
vbind.handleStyle = function (newStyle, oldStyle) {
	var el = this.el;

	// 数据更新
	if (oldStyle) {
		// 移除旧样式(设为 null)
		each(oldStyle, function (v, key) {
			oldStyle[key] = null;
		});

		updateStyle(el, oldStyle);
	}

	updateStyle(el, newStyle);
}

/**
 * 更新处理 attribute
 * @param   {String}   attr
 * @param   {String}   newValue
 * @param   {String}   oldValue
 */
vbind.handleAttr = function (attr, newValue, oldValue) {
	setAttr(this.el, attr, newValue);
}