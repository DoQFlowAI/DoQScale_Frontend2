// 소유: 공통 베이스
import PropTypes from 'prop-types';

/** 흰 카드 섹션: 제목 + 오른쪽 버튼(actions) + 내용. 문서 상세의 버전·변천사 등에 씁니다 */
export default function Card({ title, actions, className = '', children }) {
  return (
    <section className={`flex min-w-0 flex-col gap-3 rounded-3xl bg-white p-5 md:px-6 ${className}`}>
      {title || actions ? (
        <div className="flex items-center gap-2">
          <h2 className="flex-1 text-title font-bold text-ink">{title}</h2>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

Card.propTypes = {
  title: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string,
  children: PropTypes.node,
};
