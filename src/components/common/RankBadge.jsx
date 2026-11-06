import PropTypes from 'prop-types';
import Chip from './Chip';
import { rankLabel } from '../../utils/format';

export default function RankBadge({ rankLevel }) {
  const label = rankLabel(rankLevel);
  if (!label) return null;
  return <Chip tone="green">{label}</Chip>;
}

RankBadge.propTypes = {
  rankLevel: PropTypes.number.isRequired,
};
