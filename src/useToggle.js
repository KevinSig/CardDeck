import React, {useState} from 'react'

//takes in the initial value of our state
function useToggle(initialVal) {

   const [state, setState] = useState(initialVal) 
   
   const toggle = ()=>{
       setState(!state)
   }

    //return piece of state with a function to toggle it
    return [state, toggle]
}

export default useToggle
