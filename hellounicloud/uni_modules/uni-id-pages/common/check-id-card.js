function checkIdCard (idCardNumber) {
  if (!idCardNumber || typeof idCardNumber !== 'string' || idCardNumber.length !== 18) return false

  const coefficient = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCode = [1, 0, 'x', 9, 8, 7, 6, 5, 4, 3, 2]
  const code = idCardNumber.substring(17)

  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += Number(idCardNumber.charAt(i)) * coefficient[i]
  }

  return checkCode[sum % 11].toString() === code.toLowerCase()
}

export default checkIdCard
