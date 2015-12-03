;
(function (window, document, undefined) {
	var imgSlider = function (option) {
		this.number = option.number || 10; //每栏显示图片数
		this.speed = option.speed || 50; //图片滑动速度
		this.width = option.width || 120; //图片宽度
		this.height = option.height || 180; //图片高度
		this.space = option.space || 10; //图片间距
		this.root = option.root || null;

		this._width = this.width + this.space;
		this.animated = false;
		that = this;
		this.slider();
	},
	//通过类名获取元素，兼容ie
	getElementsByClassName = function (className, root, tagName) {
		if (root) {
			root = typeof root == "string" ? document.getElementById(root) : root;
		} else {
			root = document.body;
		}
		tagName = tagName || "*";
		if (document.getElementsByClassName) {
			return root.getElementsByClassName(className);
		} else {
			var tag = root.getElementsByTagName(tagName);
			var tagAll = [];
			for (var i = 0; i < tag.length; i++) {
				for (var j = 0, n = tag[i].className.split(' '); j < n.length; j++) {
					if (n[j] == className) {
						tagAll.push(tag[i]);
						break;
					}
				}
			}
			return tagAll;
		}
	}
	/*************************************************************/
	imgSlider.prototype.animate = function (m, obj, pre, next, max_left, that) {
		var total = 0;
		var step = m / 10;
		that.animated = true;
		var go = function () {
			var left = parseInt(obj.style.marginLeft);
			if (left < 0) {
				pre.style.display = 'block';
			} else {
				pre.style.display = 'none';
			}
			if (left > (-max_left * that._width)) {
				next.style.display = 'block';
			} else {
				next.style.display = 'none';
			}
			if (total === m) {
				that.animated = false;
				return;
			} else {
				total += step;
				var num = left + step;
				if (num > 0) {
					return;
				}
				obj.style.marginLeft = left + step + 'px';
				setTimeout(go, that.speed);
			}
		};
		go();
	};
	imgSlider.prototype.slider = function () {
		var column = getElementsByClassName('column', that.root, 'div');
		for (var i = 0; i < column.length; i++) {
			(function (j, that) {
				var imgs = column[j].getElementsByTagName('img');
				for (var i = 0, len = imgs.length; i < len; i++) {
					imgs[i].style.width = that.width + "px";
					imgs[i].style.height = that.height + "px";
					imgs[i].style.marginRight = that.space + "px";
				}

				column[j].style.width = that._width * that.number + 'px';

				var span = column[j].getElementsByTagName('span');
				var pre = span[0];
				var next = span[1];
				var img_num = imgs.length;
				var list = getElementsByClassName('list', column[j], 'div')[0];
				list.style.width = that._width * img_num + 'px';
				if (img_num <= that.number) {
					pre.style.display = 'none';
					next.style.display = 'none';
					return;
				}
				pre.onclick = function () {
					if (that.animated) {
						return;
					}
					var left_img = Math.abs(parseInt(list.style.marginLeft) / that._width);
					if (left_img >= that.number) {
						that.animate(that._width * that.number, list, pre, next, img_num - that.number, that);
					} else {
						that.animate(that._width * (left_img), list, pre, next, img_num - that.number, that);
					}
				};
				next.onclick = function () {
					if (that.animated) {
						return;
					}
					var left_img = Math.abs(parseInt(list.style.marginLeft) / that._width) + that.number;
					if ((img_num - left_img) >= that.number) {
						that.animate(-that._width * that.number, list, pre, next, img_num - that.number, that);
					} else {
						that.animate(-that._width * (img_num - left_img), list, pre, next, img_num - that.number, that);
					}
				};
			})(i, that);
		}
	}
	window.imgSlider = imgSlider;
})(window, document);