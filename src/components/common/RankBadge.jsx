// 소유: 공통 베이스
import PropTypes from 'prop-types';
import Chip from './Chip';
import { rankLabel } from '../../utils/format';

export default function RankBadge({ rankLevel }) {
  const label = rankLabel(rankLevel);
  return label ? <Chip>{label}</Chip> : null;
}

RankBadge.propTypes = {
  rankLevel: PropTypes.number.isRequired,
};
