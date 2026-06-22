import { forwardRef } from 'react'
import ReactDatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Calendar } from 'lucide-react'

const CustomInput = forwardRef(({ value, onClick, placeholder, className }, ref) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onClick={onClick}
      placeholder={placeholder}
      readOnly
      ref={ref}
      className={className}
    />
    <Calendar 
      size={16} 
      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
    />
  </div>
))

CustomInput.displayName = 'CustomInput'

export default function DatePicker({ value, onChange, className, placeholder = "Select date" }) {
  // Parse date string as local time, not UTC
  let dateValue = null
  if (value) {
    const [year, month, day] = value.split('-').map(Number)
    dateValue = new Date(year, month - 1, day)
  }
  
  const handleChange = (date) => {
    if (date) {
      // Format as YYYY-MM-DD for consistency with input type="date"
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      onChange(`${year}-${month}-${day}`)
    } else {
      onChange('')
    }
  }
  
  return (
    <ReactDatePicker
      selected={dateValue}
      onChange={handleChange}
      dateFormat="yyyy-MM-dd"
      calendarStartDay={1}
      customInput={<CustomInput className={className} placeholder={placeholder} />}
      isClearable
      showYearDropdown
      scrollableYearDropdown
      yearDropdownItemNumber={15}
    />
  )
}
