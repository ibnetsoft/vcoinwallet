'use client'

interface PrivacyConsentModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PrivacyConsentModal({ isOpen, onClose }: PrivacyConsentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">개인(민감)정보 수집·이용 동의서</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-sm text-gray-700 leading-relaxed">
            <p className="mb-2">
              • 쓰리디썬 테크 주식회사가 처리하는 모든 개인정보는「개인정보 보호법」등 관련 법령상의 개인정보 보호 규정을 준수하며, 공공업무의 적절한 수행과 이용자의 개인정보 보호 및 권익보호 등 적법하고 적정하게 취급하기 위해 최선을 다하고 있습니다.
            </p>
            <p className="mb-2">
              • 쓰리디썬 테크 주식회사 (이하 '회사'라 함)은 「개인정보보호법」, 「신용정보의 이용 및 보호에 관한 법률」, 「특정 금융거래정보의 보고 및 이용 등에 관한 법률」에 따라 귀하의 개인(신용)정보를 수집·이용하기 위해 다음과 같이 동의를 받고자 합니다.
            </p>
            <p>
              ※ 귀하는 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다. 단, 동의 거부 시 회원가입, 금융 거래 서비스 이용, 디지털 자산 반환 처리 등이 불가할 수 있습니다.
            </p>
          </div>

          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3 text-base">개인정보의 수집 및 이용에 관한 동의</h3>

            <div className="mb-4">
              <p className="font-semibold text-gray-900 mb-2">1. 개인정보 수집·이용 목적</p>
              <p className="text-sm text-gray-700 ml-4">- 이메일 및 문자메세지 발송 등의 각종 안내</p>
              <p className="text-sm text-gray-700 ml-4">- 코인현황 지급 및 수정 조회 확인 등</p>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-gray-900 mb-2">2. 개인정보 수집·이용 항목</p>
              <p className="text-sm text-gray-700 ml-4">- 성명(한글), 주민등록번호 앞 6자리 및 뒷자리 첫째자리, 주소, 연락처(휴대전화, 휴대전화번호, E-mail) 등</p>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-gray-900 mb-2">3. 개인(민감)정보 수집·이용 기간 (필수)</p>

              <table className="w-full border-collapse border border-gray-800 text-sm mt-2">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-800 px-4 py-2 text-left">수집·이용 목적</th>
                    <th className="border border-gray-800 px-4 py-2 text-left">수집하는 개인(민감)정보의 항목</th>
                    <th className="border border-gray-800 px-4 py-2 text-left">보유 및 이용기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-800 px-4 py-2 align-top">
                      - 송금한 가상 자산의 반환 처리 및 관련 문의 대응 등 제반 업무 이행<br/>
                      - 송금인 신원 확인<br/>
                      - 가상자산이용자 보호 등에 관한 법률, 특정금융거래정보의 보고 및 이용등에 관한 법률 및 관계 법령에 따른 의무 이행
                    </td>
                    <td className="border border-gray-800 px-4 py-2 align-top">
                      □ 성명(한글)<br/>
                      □ 주민등록번호 (앞 6자리 및 뒷자리 첫째자리)<br/>
                      □ 주소<br/>
                      □ 연락처(유선전화, 휴대전화번호, E-mail)
                    </td>
                    <td className="border border-gray-800 px-4 py-2 align-top">
                      - 회원탈퇴 후 5년<br/>
                      - 단, 관련 법령에 의한 보유 의견이 있는 경우 해당 기간까지 보존 후 파기
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-300 rounded text-center">
              <p className="font-bold text-gray-900 mb-2">
                본 동의서 내용을 충분히 숙지하였으며 확인하며, 개인(민감)정보를 수집·이용하는데 동의하십니까?
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <p className="text-center text-sm text-gray-600 mb-3">
            회원가입 페이지에서 "동의함" 체크박스를 선택하시면 회원가입을 진행하실 수 있습니다.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
