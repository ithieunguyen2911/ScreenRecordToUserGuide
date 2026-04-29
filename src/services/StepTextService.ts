import { RecordedAction } from '../models';

const CONTROL_LABELS: Record<string, string> = {
  Button: 'nút',
  CheckBox: 'checkbox',
  RadioButton: 'radio button',
  Edit: 'ô nhập liệu',
  Document: 'vùng nội dung',
  ComboBox: 'dropdown',
  List: 'danh sách',
  ListItem: 'mục',
  MenuItem: 'menu',
  DataGrid: 'bảng dữ liệu',
  Pane: 'vùng màn hình',
  Hyperlink: 'liên kết',
};

export class StepTextService {
  createTitle(action: RecordedAction, index: number): string {
    const target = this.getTargetName(action);
    if (!target) return `Thao tác ${index + 1}`;

    switch (action.action) {
      case 'click':
        return `Click ${this.getControlLabel(action)} ${target}`;
      case 'type':
        return `Nhập dữ liệu vào ${this.getControlLabel(action)} ${target}`;
      case 'select':
        return `Chọn ${target}`;
      case 'scroll':
        return `Cuộn tại ${target}`;
      case 'hotkey':
        return `Sử dụng phím tắt tại ${target}`;
      case 'navigate':
        return `Chuyển đến ${target}`;
      default:
        return `Thao tác ${index + 1}`;
    }
  }

  createDescription(action: RecordedAction): string {
    const target = this.getTargetName(action);
    const control = this.getControlLabel(action);

    switch (action.action) {
      case 'click':
        return target ? `Click vào ${control} ${target}.` : 'Click vào vị trí được đánh dấu trên màn hình.';
      case 'type':
        return target ? `Nhập dữ liệu vào ${control} ${target}.` : 'Nhập dữ liệu vào vùng được đánh dấu trên màn hình.';
      case 'select':
        return target ? `Chọn giá trị trong ${control} ${target}.` : 'Chọn một giá trị trong dropdown hoặc danh sách.';
      case 'scroll':
        return target ? `Cuộn trong ${control} ${target}.` : 'Cuộn màn hình để xem thêm nội dung.';
      case 'hotkey':
        return target ? `Sử dụng phím tắt tại ${control} ${target}.` : 'Sử dụng phím tắt trên màn hình hiện tại.';
      case 'navigate':
        return target ? `Chuyển đến ${control} ${target}.` : 'Chuyển sang màn hình hoặc trạng thái tiếp theo.';
      default:
        return 'Xem lại màn hình tại thời điểm này và chỉnh sửa mô tả nếu cần.';
    }
  }

  private getTargetName(action: RecordedAction): string {
    return (action.target || action.label || '').replace(/^(Click|Type in|Select|Scroll)\s+/i, '').trim();
  }

  private getControlLabel(action: RecordedAction): string {
    if (!action.controlType) return action.action === 'type' ? 'ô nhập liệu' : 'vùng';
    return CONTROL_LABELS[action.controlType] ?? action.controlType.toLowerCase();
  }
}

export const stepTextService = new StepTextService();
