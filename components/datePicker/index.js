import React, { PureComponent, createRef } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import cls from "classnames";
import Input from "../input";
import Spin from "../spin";
import moment from "moment";
import scrollIntoViewIfNeeded from "scroll-into-view-if-needed";
import { debounce } from "../utils";
import { DownIcon, ArrowLeftIcon, ArrowRightIcon } from "../icon";

const positions = {
  top: "top",
  bottom: "bottom"
};
export default class DataPicker extends PureComponent {
  state = {
    momentSelected: this.props.defaultValue || this.props.value || moment(),
    momentSelectedTemplate:
      this.props.defaultValue || this.props.value || moment(),
    visible: null,
    isSelected: false,
    extraFooter: null,
    //第一次没选择日期 并且没有初始值 就显示 placeholder
    isSelectedMoment: !!(this.props.defaultValue || this.props.value)
  };
  static defaultProps = {
    prefixCls: "cuke-date-picker",
    format: "YYYY-MM-DD",
    onPanelVisibleChange: () => {},
    onChange: () => {},
    placeholder: "请选择",
    loading: false,
    showToday: true,
    showClear: true,
    tip: "",
    showDayInPrevMonth: true,
    showDayInNextMonth: true,
    position: positions.bottom,
    getPopupContainer: () => document.body
  };
  static propTypes = {
    prefixCls: PropTypes.string.isRequired,
    onPanelVisibleChange: PropTypes.func,
    onChange: PropTypes.func,
    format: PropTypes.string,
    loading: PropTypes.bool,
    showClear: PropTypes.bool,
    tip: PropTypes.any,
    showToday: PropTypes.bool,
    showDayInPrevMonth: PropTypes.bool,
    showDayInNextMonth: PropTypes.bool,
    position: PropTypes.oneOf(Object.values(positions)),
    overlay: PropTypes.oneOfType([
      PropTypes.element,
      PropTypes.string,
      PropTypes.object
    ])
  };
  constructor(props) {
    super(props);
    this.toggleContainer = createRef();
    this.wrapper = createRef();
    this.wrapper = createRef();
    this.triggerWrapper = createRef();
  }
  static getDerivedStateFromProps({ value }, { momentSelected }) {
    if (!value || value.valueOf() === momentSelected.valueOf()) {
      return null;
    }
    return {
      momentSelected: value,
      isSelectedMoment: !!value
    };
  }

  onTogglePanel = () => {
    const visible = !this.state.visible;
    this.setState({ visible }, () => {
      if (visible) {
        this.setWrapperBounding(() => {
          scrollIntoViewIfNeeded(this.wrapper.current, {
            scrollMode: "if-needed",
            behavior: "smooth",
            block: "nearest",
            inline: "nearest"
          });
        });
      }
    });
    this.props.onPanelVisibleChange(visible);
  };

  addMonth = () => {
    this.setState({
      momentSelected: this.state.momentSelected.clone().add(1, "month")
    });
  };

  subtractMonth = () => {
    this.setState({
      momentSelected: this.state.momentSelected.clone().add(-1, "month")
    });
  };

  selectedDate = date => isNextMonth => () => {
    let momentSelected = this.state.momentSelected.clone();

    if (isNextMonth === true) {
      momentSelected.add(1, "month").date(date);
    } else if (isNextMonth === false) {
      momentSelected.subtract(1, "month").date(date);
    } else {
      momentSelected.date(date);
    }
    this.setState(
      {
        isSelected: true,
        momentSelected,
        momentSelectedTemplate: momentSelected.clone(),
        visible: false,
        isSelectedMoment: true
      },
      () => {
        this.props.onPanelVisibleChange(false);
        this.props.onChange(
          date,
          this.state.momentSelected,
          this.state.momentSelected.format(this.props.format)
        );
      }
    );
  };

  setWrapperBounding(cb = () => {}) {
    const { left, top } = this.getWrapperBounding();
    this.setState({ left, top }, cb);
  }

  getWrapperBounding = () => {
    const {
      height,
      top,
      left
    } = this.triggerWrapper.current.getBoundingClientRect();
    const {
      height: wrapperHeight
    } = this.wrapper.current.getBoundingClientRect();

    const { scrollY } = window;

    const positions = {
      top: {
        top: top + scrollY - wrapperHeight - 10,
        left
      },
      bottom: {
        top: top + height + scrollY,
        left
      }
    };
    return positions[this.props.position];
  };

  renderCalendarContent = () => {
    const { prefixCls, showDayInNextMonth, showDayInPrevMonth } = this.props;
    const momentDateFirst = this.state.momentSelected.clone().date(1);
    const daysInMonth = momentDateFirst.daysInMonth();

    const weekdayInMonth = momentDateFirst.isoWeekday();
    const lastDaysInMonth = (daysInMonth + weekdayInMonth - 1) % 7;

    return (
      <>
        <div>
          {["一", "二", "三", "四", "五", "六", "日"].map(day => (
            <span
              className={cls(`${prefixCls}-item`, `${prefixCls}-day-title`)}
              key={day}
            >
              {day}
            </span>
          ))}
        </div>

        {new Array(weekdayInMonth - 1).fill(null).map((_, weekday) => {
          const date = moment()
            .weekday(weekday)
            .date();
          return (
            <span
              className={cls(`${prefixCls}-item`, `${prefixCls}-last-month`)}
              key={`first-date-${date}`}
              onClick={
                showDayInPrevMonth ? this.selectedDate(date)(false) : undefined
              }
            >
              {showDayInPrevMonth && date}
            </span>
          );
        })}

        {new Array(daysInMonth).fill(null).map((_, date) => (
          <span
            className={cls(`${prefixCls}-item`, `${prefixCls}-current-month`, {
              [`${prefixCls}-selected-date`]:
                this.state.momentSelected.date() === date + 1
            })}
            key={`date-${date}`}
            onClick={this.selectedDate(date + 1)()}
          >
            {date + 1}
            <div className={cls(`${prefixCls}-item-content`)}>
              {this.props.dateCellRender &&
                this.props.dateCellRender(
                  date + 1,
                  this.state.momentSelected.clone()
                )}
            </div>
          </span>
        ))}

        {new Array(lastDaysInMonth === 0 ? 0 : 7 - lastDaysInMonth)
          .fill(null)
          .map((_, date) => (
            <span
              className={cls(`${prefixCls}-item`, `${prefixCls}-next-month`)}
              key={`next-date-${date}`}
              onClick={
                showDayInNextMonth
                  ? this.selectedDate(date + 1)(true)
                  : undefined
              }
            >
              {showDayInNextMonth && date + 1}
            </span>
          ))}
      </>
    );
  };
  onSelectToday = () => {
    const currentMoment = moment();
    this.setState(
      {
        momentSelected: currentMoment,
        selectedDate: currentMoment.date()
      },
      () => {
        this.selectedDate(this.state.selectedDate)()();
      }
    );
  };
  onClickOutsideHandler = e => {
    e.stopPropagation();
    if (
      this.state.visible &&
      !this.props.disabled &&
      !this.toggleContainer.current.contains(e.target) &&
      !this.wrapper.current.contains(e.target)
    ) {
      this.setState({ visible: false });
      this.props.onPanelVisibleChange(false);
    }
  };
  clearDate = () => {
    const momentSelected = moment();
    const selectedDate = momentSelected.date();
    this.setState(
      {
        momentSelected,
        selectedDate,
        visible: false,
        isSelectedMoment: false
      },
      () => {
        this.props.onChange(undefined, undefined, "");
        this.props.onPanelVisibleChange(false);
      }
    );
  };
  onResizeHandler = debounce(() => {
    this.setWrapperBounding();
  }, 500);
  render() {
    const {
      prefixCls,
      className,
      disabled,
      placeholder,
      format,
      extraFooter,
      showToday,
      showClear,
      tip,
      showDayInPrevMonth, //eslint-disable-line
      showDayInNextMonth, //eslint-disable-line
      loading, //eslint-disable-line
      onSelectedDateChange, //eslint-disable-line
      onPanelVisibleChange, //eslint-disable-line
      getPopupContainer,
      position,
      ...attr
    } = this.props;

    const {
      visible,
      left,
      top,
      isSelectedMoment,
      momentSelectedTemplate
    } = this.state;

    return (
      <div
        className={cls(prefixCls, className, {
          [`${prefixCls}-position-${position}`]: position
        })}
        {...attr}
        ref={this.toggleContainer}
      >
        <div
          className={cls(`${prefixCls}-inner`, {
            [`${prefixCls}-active`]: visible
          })}
          ref={this.triggerWrapper}
        >
          <Input
            disabled={disabled}
            readonly
            placeholder={placeholder}
            className={cls(`${prefixCls}-input`)}
            value={
              isSelectedMoment ? momentSelectedTemplate.format(format) : ""
            }
            onClick={disabled ? undefined : this.onTogglePanel}
          />
          <DownIcon className={`${prefixCls}-arrow`} />
        </div>
        {createPortal(
          <div
            className={cls(`${prefixCls}-content`, {
              [`${prefixCls}-open`]: visible,
              [`${prefixCls}-close`]: !visible,
              ["cuke-ui-no-animate"]: visible === null
            })}
            ref={this.wrapper}
            style={{
              left,
              top
            }}
          >
            <Spin size="large" spinning={loading} tip={tip}>
              <div className={cls(`${prefixCls}-header`)}>
                <span className={cls(`${prefixCls}-date`)}>
                  {this.state.momentSelected.year()}年 {"  "}
                  {this.state.momentSelected.month() + 1}月
                </span>
                <span className={cls(`${prefixCls}-switch`)}>
                  <span
                    className={cls(`${prefixCls}-switch-group`)}
                    onClick={this.subtractMonth}
                  >
                    <ArrowLeftIcon />
                  </span>
                  <span
                    className={cls(`${prefixCls}-switch-group`)}
                    onClick={this.addMonth}
                  >
                    <ArrowRightIcon />
                  </span>
                </span>
              </div>
              <div
                className={cls(`${prefixCls}-items`, {
                  [`${prefixCls}-loading`]: loading
                })}
              >
                {this.renderCalendarContent()}
              </div>
              {extraFooter && (
                <div className={`${prefixCls}-footer-extra`}>{extraFooter}</div>
              )}
              {showToday || showClear ? (
                <div
                  className={cls(`${prefixCls}-footer`, {
                    [`${prefixCls}-has-extra-footer`]: extraFooter,
                    [`${prefixCls}-has-border`]:
                      extraFooter || showToday || showClear
                  })}
                >
                  {showToday && (
                    <div
                      className={cls(`${prefixCls}-footer-today`)}
                      onClick={this.onSelectToday}
                    >
                      今天
                    </div>
                  )}
                  {showClear && (
                    <div
                      className={cls(`${prefixCls}-footer-clear`)}
                      onClick={this.clearDate}
                    >
                      清除
                    </div>
                  )}
                </div>
              ) : (
                undefined
              )}
            </Spin>
          </div>,
          getPopupContainer()
        )}
      </div>
    );
  }
  componentWillUnmount() {
    window.removeEventListener("click", this.onClickOutsideHandler, false);
    window.removeEventListener("resize", this.onResizeHandler);
  }
  componentDidMount() {
    window.addEventListener("click", this.onClickOutsideHandler, false);
    window.addEventListener("resize", this.onResizeHandler);
  }
}
