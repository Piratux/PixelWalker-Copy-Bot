import 'izitoast/dist/css/iziToast.min.css'
import iZtoast from 'izitoast'

export const MessageService = {
  error: (message: string, title = 'Error') => {
    return iZtoast.error({
      color: '#FF7F27',
      title: title,
      timeout: 10000,
      message: message,
      position: 'bottomCenter',
    })
  },
  success: (message: string, title = 'success') => {
    return iZtoast.success({
      color: '#66DD00',
      title: title,
      message: message,
      position: 'bottomCenter',
    })
  },
  info: (message: string, title = 'info') => {
    return iZtoast.info({
      color: '#66AADD',
      title: title,
      message: message,
      position: 'bottomCenter',
    })
  },
  question: (message: string, onYes: () => void, title = 'question') => {
    return iZtoast.question({
      title: title,
      message: message,
      color: '#FFD300',
      position: 'center',
      timeout: 20000,
      close: false,
      overlay: true,
      id: 'question',
      zindex: 999,
      buttons: [
        [
          '<button><b>Yes</b></button>',
          function (instance, toast) {
            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button')
            onYes()
          },
          true,
        ],
        [
          '<button>No</button>',
          function (instance, toast) {
            instance.hide({ transitionOut: 'fadeOut' }, toast, 'button')
          },
          false,
        ],
      ],
    })
  },
}
