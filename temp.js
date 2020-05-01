import Typography from '@material-ui/core/Typography'

import Menu from '@material-ui/core/Menu'
import React from 'react';

const STATUS_OPTIONS = {
  taskProgressOpen: "Open",
  taskProgressInProgress:"In Progress",
  taskProgressComplete: "Complete",
  taskProgressReadyForReview:"Ready For Review",
  taskProgress: "Percent Complete"
}

const STATUS_COLOR_MAP = {
  Open: 'lightgrey',
  'In Progress': '#fff2cc',
  'Ready For Review': '#c9daf8',
  Complete: '#d9ead3',
  "Percent Complete": "white"
}


const StatusPicker = props => {
  const { subProgress, color,onSelect} = props
  const [anchor, setAnchor] = React.useState(null)


  // const onSelect = (e)=>{
  //   setColor(e)
  //   const key = Object.keys(STATUS_OPTIONS).find(key => STATUS_OPTIONS[key] === e)
  //   setSubProgress(key)
  //   }


  return (
    <div>
      <div
        style={{
          height: "15px",
          width: "15px",
          backgroundColor: STATUS_COLOR_MAP[color] || 'lightgrey',
          borderRadius: "50%",
          cursor: 'pointer'
        }}
        onClick={e => setAnchor(e.currentTarget)}
      >
      </div>
      <Menu
        elevation={1}
        keepMounted
        disableAutoFocusItem
        transitionDuration={0}
        getContentAnchorEl={null}
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
      >
        <div
          style={{
            padding: '0px 5px'
          }}
        >
          {Object.values(STATUS_OPTIONS).map((status, i) => {
            return (
              <div
                className="task-modal-actions-button"
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 25,
                  margin: '2px 0px',
                  backgroundColor: STATUS_COLOR_MAP[status],
                  borderRadius: '5px'
                }}
                onClick={() => {
                  onSelect(status)
                  setAnchor(null)
                }}
              >
                <Typography style={{ fontSize: 10 }}>
                  {status.toUpperCase()}
                </Typography>
              </div>
            )
          })}
        </div>
      </Menu>
    </div>
  )
}

export default StatusPicker