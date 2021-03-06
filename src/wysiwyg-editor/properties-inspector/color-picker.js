// import React, { Component } from "react";
// import { SketchPicker } from 'react-color';

// const styles = {
//   swatch: {
//     width: '40px',
//     height: '18px',
//     padding: '2px',
//     background: '#fff',
//     borderRadius: '1px',
//     boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
//     display: 'inline-block',
//     cursor: 'pointer',
//   },
//   swatchNoColor: {
//     width: '40px',
//     height: '18px',
//     padding: 0,
//     background: '#fff',
//     borderRadius: '1px',
//     boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
//     display: 'inline-block',
//     cursor: 'pointer',
//   },
//   popover: {
//     position: 'absolute',
//     zIndex: '2',
//   },
//   cover: {
//     position: 'fixed',
//     top: '0px',
//     right: '0px',
//     bottom: '0px',
//     left: '0px',
//   }
// }

// export default class extends Component {

//   state = { pickerShown: false, color: '#fff' }

//   constructor(props) {
//     super(props)

//     const { value, onSelect = () => { console.log('You have to pass onSelect property to color picker') } } = props

//     this.onSelect = onSelect

//     this.state.color = value
//   }

//   handleClick = event => {
//     if (event.altKey) {
//       this.setState({ color: null, pickerShown: false })
//       this.onSelect(null)
//     }
//     else {
//       this.setState({ pickerShown: !this.state.pickerShown })
//     }
//   };

//   handleClose = () => {
//     this.setState({ pickerShown: false })
//   };

//   handleChange = (color) => {
//     this.setState({ color: color.hex })
//     this.onSelect(this.state.color)
//   };

//   render() {

//     const { color } = this.state

//     const fillColor = color || '#fff'

//     return (
//       <div>
//         <div style={color ? styles.swatch : styles.swatchNoColor} onClick={this.handleClick}>
//           {color ?
//             <div style={{
//               width: '36px',
//               height: '14px',
//               borderRadius: '2px',
//               backgroundColor: fillColor
//             }} /> :
//             <svg height="18" width="40" viewBox="0 0 40 18">
//               <line x1="0" y1="0" x2="40" y2="18" style={{ stroke: "rgb(255,0,0)", strokeWidth: 2 }} />
//             </svg>
//           }
//         </div>
//         {this.state.pickerShown ? <div style={styles.popover}>
//           <div style={styles.cover} onClick={this.handleClose} />
//           <SketchPicker disableAlpha={this.props.disableAlpha} color={fillColor} onChange={this.handleChange} presetColors={[]} />
//         </div> : null}

//       </div>
//     )
//   }
// }
