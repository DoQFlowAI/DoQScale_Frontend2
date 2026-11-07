// 소유: WJH
import PropTypes from 'prop-types';

export default function VersionUploadPanel({ files, onChange, startVersionNo, disabled = false }) {

    return (
        <div>
            업로드 패널 (파일 {files.length}개, 시작 버전: v{startVersionNo})
        </div>
    );
}

VersionUploadPanel.propTypes = {
    files: PropTypes.arrayOf(PropTypes.instanceOf(File)).isRequired,
    onChange: PropTypes.func.isRequired,
    startVersionNo: PropTypes.number.isRequired,
    disabled: PropTypes.bool
};
