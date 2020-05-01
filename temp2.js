import React, { useEffect, useState } from 'react'
import Typography from '@material-ui/core/Typography'
import CircularProgress from '@material-ui/core/CircularProgress'
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown'
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp'
import CompanyRow from './CompanyRow'
import moment from 'moment'
import periodify from '../../util/periodify'
import datify from '../../util/datify'
import noonify from '../../util/noonify'
import IconStatusPicker from "../Reusable/IconStatusPicker"

import { getNextMonthlyDateFromDate } from '../../util/recurringDates'


const INITIAL_COMPANY_PERIOD = {
  taskStatus: {
    open: 0,
    'in progress': 0,
    'ready for review': 0,
    complete: 0
  },
  workbookStatus: {
    open: 0,
    'in progress': 0,
    complete: 0
  },
  closed: false
}


const CompaniesTable = props => {
  const [companies, setCompanies] = useState([])
  const [sortType, setSortType] = useState('date')
  const [loading, setLoading] = useState(false)
  const [reverse, setReverse] = useState(true)


  const [subProgress, setSubProgress] = useState('taskProgress')
  const [color, setColor] = useState('')

  const handleChange = (event) => {
    setSubProgress(event.target.value);
  };

  const getCompanyPeriod = async (company, period) => {
    const teamId = props.teamId
    const periodId = moment(periodify(datify(period))).format('YYYY-MM')
    const periodDate = periodify(datify(period))

    const companyPeriodRef = props.firebase
      .firestore()
      .collection(`teams/${teamId}/companies/${company.companyId}/periods`)
      .doc(periodId)

    const companyPeriodDoc = await companyPeriodRef.get()
    const _lastClose = company.lastClose
      ? periodify(datify(company.lastClose))
      : false

    let periodTemplate = INITIAL_COMPANY_PERIOD
    if (_lastClose) {
      const closed = moment(periodDate).isSameOrBefore(datify(_lastClose))
      periodTemplate = { ...periodTemplate, closed }
    }

    if (company.targetClose) {
      const targetCloseDate = noonify(
        getNextMonthlyDateFromDate(company.targetClose, periodify(period))
      )
      periodTemplate = { ...periodTemplate, targetCloseDate }
    }

    if (!companyPeriodDoc.exists) {
      await companyPeriodRef.set(periodTemplate)
      return { ...company, period: { ...periodTemplate } }
    } else {
      return { ...company, period: { ...companyPeriodDoc.data() } }
    }
  }

  const getCompaniesWithPeriods = async companies => {
    setLoading(true)
    let companiesWithPeriods = []
    for (let company of companies) {
      const companyWithPeriod = await getCompanyPeriod(company, props.period)
      companiesWithPeriods.push(companyWithPeriod)
    }
    setCompanies(companiesWithPeriods)
    setLoading(false)
  }

  const updateTargetCloseDate = async (companyId, date) => {
    const teamId = props.teamId
    const periodId = moment(periodify(datify(props.period))).format('YYYY-MM')

    const companyPeriodRef = props.firebase
      .firestore()
      .collection(`teams/${teamId}/companies/${companyId}/periods`)
      .doc(periodId)

    const updatedCompanies = companies.map(company => {
      return company.companyId === companyId
        ? {
            ...company,
            period: {
              ...company.period,
              targetCloseDate: noonify(datify(date)),
              manualTargetCloseDate: true
            }
          }
        : { ...company }
    })

    setCompanies(updatedCompanies)
    await companyPeriodRef.update({
      targetCloseDate: noonify(datify(date)),
      manualTargetCloseDate: true
    })
  }

  const getTaskProgressTotal = taskStatus => {
    const total = Object.keys(taskStatus).reduce((total, el) => {
      return (total += taskStatus[el])
    }, 0)
    if (total === 0) return -1
    return taskStatus.complete / total
  }

  const STATUS_OPTIONS = {
    taskProgressOpen: "Open",
    taskProgressInProgress:"In Progress",
    taskProgressComplete: "Complete",
    taskProgressReadyForReview:"Ready For Review",
    taskProgress: "Percent Complete"
  }

  const getSortingArray = () => {
    return companies.map(company => {
      return {
        companyId: company.companyId,
        name: company.name,
        targetCloseDate: company.period.targetCloseDate,
        taskProgress: getTaskProgressTotal(company.period.taskStatus),
        taskProgressOpen:company.period.taskStatus.open,
        taskProgressInProgress:company.period.taskStatus['in progress'],
        taskProgressReadyForReview:company.period.taskStatus['ready for review'],
        taskProgressComplete:company.period.taskStatus.complete, 
        closed: company.period.closed
      }
    })
  }
  const sortedCompanies = type => {
    const sortingArray = getSortingArray()
    let sorted = []

    switch (type) {
      case 'name':
        if (reverse === true) {
          sorted = sortingArray.sort((a, b) => a.name.localeCompare(b.name))
        } else {
          sorted = sortingArray.sort((a, b) => b.name.localeCompare(a.name))
        }
        break
      case 'date':
        if (reverse === true) {
          sorted = sortingArray
            .sort((a, b) => {
              return datify(a.targetCloseDate) - datify(b.targetCloseDate)
            })
            .sort((a, b) => {
              const aClosedDate = a.closedDate ? datify(a.closedDate) : 0
              const bClosedDate = b.closedDate ? datify(b.closedDate) : 0
              return a.closed - b.closed || aClosedDate - bClosedDate
            })
        } else {
          sorted = sortingArray
            .sort((a, b) => {
              return datify(b.targetCloseDate) - datify(a.targetCloseDate)
            })
            .sort((a, b) => {
              const bClosedDate = b.closedDate ? datify(b.closedDate) : 0
              const aClosedDate = a.closedDate ? datify(a.closedDate) : 0
              return b.closed - a.closed || bClosedDate - aClosedDate
            })
        }
        break
      case 'progress':
        if (reverse === true) {
          sorted = sortingArray.sort((a, b) => a[subProgress] - b[subProgress])
        } else {
          sorted = sortingArray.sort((a, b) => b[subProgress] - a[subProgress])
        }

      case 'status':
        if (reverse === true) {
          sorted = sortingArray.sort((a, b) => a.closed - b.closed)
        } else {
          sorted = sortingArray.sort((a, b) => b.closed - a.closed)
        }

        break
      default:
        sorted = sortingArray.sort((a, b) => a.name.localeCompare(b.name))
    }

    const sortMap = sorted.reduce((map, el, i) => {
      const companyId = el.companyId
      return { ...map, [companyId]: i }
    }, {})

    const sortedCompanies = companies.sort((a, b) => {
      return sortMap[a.companyId] - sortMap[b.companyId]
    })

    const filteredSortedCompanies = companies.filter(c => {
      return getTaskProgressTotal(c.period.taskStatus) > -1
    })

    return props.withTasksOnly ? filteredSortedCompanies : sortedCompanies
  }

  useEffect(() => {
    if (props.period) {
      getCompaniesWithPeriods(props.companies)
    }
  }, [props.companies, props.period])

  return (
    <div
      style={{
        width: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '5px 10px',
          backgroundColor: '#2b3a42',
          height: 45
        }}
      >
        <div
          className="flex-row-center"
          style={{
            fontSize: 12,
            textDecoration: sortType == 'name' ? 'underline' : '',
            color: 'white',
            minWidth: '15%',
            maxWidth: '15%'
          }}
          onClick={() => {
            setSortType('name')
            setReverse(!reverse)
          }}
        >
          <Typography
            className="clickable"
            style={{
              fontSize: 12,
              textDecoration: sortType == 'name' ? 'underline' : '',
              color: 'white'
            }}
          >
            Company
          </Typography>
          {sortType == 'name' ? (
            reverse == true ? (
              <ArrowDropUpIcon
                fontSize="large"
                style={{
                  color: 'white',
                  marginLeft: 5
                }}
              />
            ) : (
              <ArrowDropDownIcon
                fontSize="large"
                style={{
                  color: 'white',
                  marginLeft: 5
                }}
              />
            )
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '10%'
          }}
          onClick={() => {
            setSortType('date')
            setReverse(!reverse)
          }}
        >
          <Typography
            className="clickable"
            style={{
              fontSize: 12,
              textDecoration: sortType == 'date' ? 'underline' : '',
              color: 'white'
            }}
            onClick={() => {
              setSortType('date')
              setReverse(!reverse)
            }}
          >
            Close Date
          </Typography>
          {sortType == 'date' ? (
            reverse == true ? (
              <ArrowDropUpIcon
                fontSize="large"
                style={{
                  color: 'white'
                }}
              />
            ) : (
              <ArrowDropDownIcon
                fontSize="large"
                style={{
                  color: 'white'
                }}
              />
            )
          ) : null}
        </div>
        
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '10%'
          }}
          onClick={() => {
            setSortType('progress')
            setReverse(!reverse)
          }}
        >
          <Typography
            className="clickable"
            style={{
              fontSize: 12,
              textDecoration: sortType == 'progress' ? 'underline' : '',
              color: 'white'
            }}
          >
            Task Progress
          </Typography>
          {sortType == 'progress' ? (
            reverse == true ? (
              <ArrowDropUpIcon
                fontSize="large"
                style={{
                  color: 'white'
                }}
              />
            ) : (
              <ArrowDropDownIcon
                fontSize="large"
                style={{
                  color: 'white'
                }}
              />
            )
          ) : null}
        </div>

        <div
          style={{
            fontSize: 12,
            display: "flex",
            alignItems: 'center',
            color: 'white',
            width: '23%'
          }}
        >
        {sortType == 'progress' ? (
        <IconStatusPicker
        subProgress ={subProgress}
        color = {color}
        onSelect = {e =>{
          setColor(e)
          const key = Object.keys(STATUS_OPTIONS).find(key => STATUS_OPTIONS[key] === e)
          setSubProgress(key)
        }}
        />

        ) : null}
        </div>

        <Typography
          style={{
            fontSize: 12,
            color: 'white',
            width: '8%'
          }}
        >
          Reviewer
        </Typography>
        <Typography
          style={{
            fontSize: 12,
            color: 'white',
            width: '22%',
            marginRight: 10
          }}
        >
          Notes
        </Typography>

        <div
          style={{
            display: 'flex',
            alignItems: 'center'
            // padding: "5px 10px",
          }}
          onClick={() => {
            setSortType('status')
            setReverse(!reverse)
          }}
        >
          <Typography
            className="clickable"
            style={{
              fontSize: 12,
              textDecoration: sortType == 'status' ? 'underline' : '',
              color: 'white'
            }}
          >
            Status
          </Typography>
          {sortType == 'status' ? (
            reverse == true ? (
              <ArrowDropUpIcon
                fontSize="large"
                style={{
                  color: 'white'
                }}
              />
            ) : (
              <ArrowDropDownIcon
                fontSize="large"
                style={{
                  color: 'white'
                }}
              />
            )
          ) : null}
        </div>
      </div>
      <div
        style={{
          border: '1px solid lightgrey',
          maxHeight: '70vh',
          overflow: 'auto'
        }}
      >
        {loading ? (
          <div
            className="flex-row-center"
            style={{ padding: '5px 10px', justifyContent: 'center' }}
          >
            <CircularProgress style={{ color: '#ff530d' }} size={30} />
          </div>
        ) : (
          sortedCompanies(sortType).map(company => (
            <CompanyRow
              key={company.companyId}
              company={company}
              firebase={props.firebase}
              period={props.period}
              setFilter={props.setFilter}
              teamId={props.teamId}
              selected={props.selectedCompanies.includes(company.companyId)}
              selectCompany={props.selectCompany}
              unselectCompany={props.unselectCompany}
              updateTargetCloseDate={updateTargetCloseDate}
              isAdmin={props.user.role === 'admin'}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default CompaniesTable
