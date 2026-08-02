from sqlalchemy import select

from app.models import Province


def test_insert_and_commit(db_session):
    db_session.add(Province(code="99", name="Tỉnh Test", type="Tỉnh", is_active=True))
    db_session.commit()
    assert db_session.execute(select(Province).filter_by(code="99")).scalar_one()


def test_previous_test_rolled_back(db_session):
    assert db_session.execute(select(Province).filter_by(code="99")).scalar_one_or_none() is None
