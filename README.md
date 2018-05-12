## vue-tap-and-hold

This is a lightweight vue2 plugin for Tap Event and Long Press Event in mobile

## How To use
```bash
npm i vue-tap-and-hold --save
```
```javascript
import TapAndHold from 'vue-tap-and-hold'
Vue.use(vueTap, {
	holdTime: 2000, // default is 1000
	tapTime: 200 // default is 200
})
```
You can also directly include it with a ```<script>``` tag

template 
```html
<!-- tap -->
<p v-tap="handle"></p> 

<!-- long press -->
<p v-hold="handle"></p> 

<!-- preventDefault -->
<p v-hold.prevent="handle"></p> 

<!-- stopPropagation -->
<p v-hold.stop="handle"></p> 

<!-- with params -->
<p v-tap="handle.bind(null, params)"></p> 
```
